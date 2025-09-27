const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Lire le package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));

// Obtenir les dépendances
const dependencies = packageJson.dependencies || {};
const devDependencies = packageJson.devDependencies || {};
const allDependencies = { ...dependencies, ...devDependencies };

// Vérifier les mises à jour avec npm-check-updates
try {
  const output = execSync('npx npm-check-updates --format json').toString();
  const updates = JSON.parse(output);
  
  if (Object.keys(updates).length === 0) {
    console.log(chalk.green('Toutes les dépendances sont à jour!'));
  } else {
    console.log(chalk.yellow('Mises à jour disponibles:'));
    console.log(chalk.yellow('------------------------'));
    
    // Trier les mises à jour par type (majeure, mineure, patch)
    const major = [];
    const minor = [];
    const patch = [];
    
    for (const [pkg, version] of Object.entries(updates)) {
      const current = allDependencies[pkg].replace(/^\^|~/, '');
      const [currentMajor, currentMinor, currentPatch] = current.split('.').map(Number);
      const [newMajor, newMinor, newPatch] = version.replace(/^\^|~/, '').split('.').map(Number);
      
      const update = {
        package: pkg,
        current: allDependencies[pkg],
        new: version
      };
      
      if (newMajor > currentMajor) {
        major.push(update);
      } else if (newMinor > currentMinor) {
        minor.push(update);
      } else {
        patch.push(update);
      }
    }
    
    // Afficher les mises à jour majeures
    if (major.length > 0) {
      console.log(chalk.red('\nMises à jour majeures (potentiellement avec des changements incompatibles):'));
      major.forEach(({ package, current, new: newVersion }) => {
        console.log(chalk.red(`  ${package}: ${current} → ${newVersion}`));
      });
    }
    
    // Afficher les mises à jour mineures
    if (minor.length > 0) {
      console.log(chalk.yellow('\nMises à jour mineures (nouvelles fonctionnalités):'));
      minor.forEach(({ package, current, new: newVersion }) => {
        console.log(chalk.yellow(`  ${package}: ${current} → ${newVersion}`));
      });
    }
    
    // Afficher les mises à jour de correctifs
    if (patch.length > 0) {
      console.log(chalk.green('\nMises à jour de correctifs (corrections de bugs):'));
      patch.forEach(({ package, current, new: newVersion }) => {
        console.log(chalk.green(`  ${package}: ${current} → ${newVersion}`));
      });
    }
    
    console.log('\nPour mettre à jour les dépendances de correctifs:');
    console.log(chalk.blue('  npm run update:patch'));
    
    console.log('\nPour mettre à jour les dépendances mineures:');
    console.log(chalk.blue('  npm run update:minor'));
    
    console.log('\nPour mettre à jour toutes les dépendances:');
    console.log(chalk.blue('  npm run update:all'));
    
    console.log('\nAttention: Testez toujours après une mise à jour!');
  }
} catch (error) {
  console.error(chalk.red('Erreur lors de la vérification des mises à jour:'), error.message);
}

// Vérifier les vulnérabilités
console.log(chalk.blue('\nVérification des vulnérabilités...'));
try {
  execSync('npm audit', { stdio: 'inherit' });
} catch (error) {
  // npm audit renvoie un code d'erreur s'il trouve des vulnérabilités
  console.log(chalk.yellow('\nPour corriger les vulnérabilités automatiquement (si possible):'));
  console.log(chalk.blue('  npm audit fix'));
}
