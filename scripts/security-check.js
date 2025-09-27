const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const SEVERITY_LEVELS = ['low', 'moderate', 'high', 'critical'];
const IGNORED_ADVISORIES = []; // Add advisory IDs to ignore
const MAX_OUTDATED_DAYS = 180; // Maximum days a package can be outdated

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    log(`Error running command: ${command}`, colors.red);
    log(error.message, colors.red);
    return null;
  }
}

// Check for npm audit issues
function checkNpmAudit() {
  log('\n=== Running npm audit ===', colors.cyan);
  
  try {
    const auditOutput = runCommand('npm audit --json');
    if (!auditOutput) return false;
    
    const auditData = JSON.parse(auditOutput);
    const vulnerabilities = auditData.vulnerabilities || {};
    
    let hasIssues = false;
    let totalIssues = 0;
    
    SEVERITY_LEVELS.forEach(severity => {
      const count = vulnerabilities[severity] || 0;
      if (count > 0) {
        hasIssues = true;
        totalIssues += count;
        log(`${severity.toUpperCase()}: ${count} vulnerabilities found`, colors.red);
      }
    });
    
    if (!hasIssues) {
      log('No vulnerabilities found', colors.green);
      return true;
    }
    
    log(`\nTotal vulnerabilities: ${totalIssues}`, colors.red);
    log('\nRun npm audit fix to attempt automatic fixes', colors.yellow);
    return false;
  } catch (error) {
    log('Error parsing npm audit results', colors.red);
    return false;
  }
}

// Check for outdated packages
function checkOutdatedPackages() {
  log('\n=== Checking for outdated packages ===', colors.cyan);
  
  const outdatedOutput = runCommand('npm outdated --json');
  if (!outdatedOutput) return false;
  
  try {
    const outdatedData = JSON.parse(outdatedOutput);
    const packages = Object.keys(outdatedData);
    
    if (packages.length === 0) {
      log('All packages are up to date', colors.green);
      return true;
    }
    
    packages.forEach(pkg => {
      const data = outdatedData[pkg];
      const updateType = getUpdateType(data.current, data.wanted);
      const color = updateType === 'major' ? colors.red : 
                   updateType === 'minor' ? colors.yellow : 
                   colors.blue;
      
      log(`${pkg}: ${data.current} -> ${data.wanted} (${updateType})`, color);
    });
    
    log('\nRun npm update to update packages', colors.yellow);
    return false;
  } catch (error) {
    log('Error parsing outdated packages results', colors.red);
    return false;
  }
}

// Check package-lock.json
function checkPackageLock() {
  log('\n=== Checking package-lock.json ===', colors.cyan);
  
  const lockFile = path.join(process.cwd(), 'package-lock.json');
  if (!fs.existsSync(lockFile)) {
    log('package-lock.json not found', colors.red);
    return false;
  }
  
  try {
    const lockContent = fs.readFileSync(lockFile, 'utf8');
    JSON.parse(lockContent);
    log('package-lock.json is valid', colors.green);
    return true;
  } catch (error) {
    log('package-lock.json is invalid', colors.red);
    return false;
  }
}

// Check for known security issues in dependencies
function checkDependencyIssues() {
  log('\n=== Checking for known dependency issues ===', colors.cyan);
  
  const packageFile = path.join(process.cwd(), 'package.json');
  const packageData = require(packageFile);
  const dependencies = { 
    ...packageData.dependencies, 
    ...packageData.devDependencies 
  };
  
  const knownIssues = {
    'node-fetch@<2.6.7': 'Vulnerable to ReDoS attacks',
    'minimist@<1.2.6': 'Prototype pollution vulnerability',
    'lodash@<4.17.21': 'Prototype pollution and command injection vulnerabilities'
  };
  
  let hasIssues = false;
  
  Object.entries(dependencies).forEach(([pkg, version]) => {
    Object.entries(knownIssues).forEach(([issue, description]) => {
      const [issuePkg, issueVersion] = issue.split('@');
      if (pkg === issuePkg && compareVersions(version, issueVersion.slice(1))) {
        hasIssues = true;
        log(`${pkg}@${version}: ${description}`, colors.red);
      }
    });
  });
  
  if (!hasIssues) {
    log('No known security issues found in dependencies', colors.green);
    return true;
  }
  
  return false;
}

// Helper function to get update type (major, minor, patch)
function getUpdateType(current, wanted) {
  if (!current || !wanted) return 'unknown';
  
  const [currentMajor, currentMinor] = current.split('.');
  const [wantedMajor, wantedMinor] = wanted.split('.');
  
  if (currentMajor !== wantedMajor) return 'major';
  if (currentMinor !== wantedMinor) return 'minor';
  return 'patch';
}

// Helper function to compare versions
function compareVersions(v1, v2) {
  const normalize = v => v.replace(/[^\d.]/g, '');
  const [a1, b1, c1 = 0] = normalize(v1).split('.').map(Number);
  const [a2, b2, c2 = 0] = normalize(v2).split('.').map(Number);
  
  if (a1 !== a2) return a1 < a2;
  if (b1 !== b2) return b1 < b2;
  return c1 < c2;
}

// Main execution
function main() {
  log('Starting security checks...', colors.magenta);
  
  const results = {
    audit: checkNpmAudit(),
    outdated: checkOutdatedPackages(),
    lockfile: checkPackageLock(),
    dependencies: checkDependencyIssues()
  };
  
  log('\n=== Security Check Summary ===', colors.magenta);
  Object.entries(results).forEach(([check, passed]) => {
    log(`${check}: ${passed ? '✓ Passed' : '✗ Failed'}`, 
        passed ? colors.green : colors.red);
  });
  
  const allPassed = Object.values(results).every(r => r);
  if (!allPassed) {
    log('\nSecurity issues found. Please review and fix the issues above.', colors.red);
    process.exit(1);
  }
  
  log('\nAll security checks passed!', colors.green);
}

main();
