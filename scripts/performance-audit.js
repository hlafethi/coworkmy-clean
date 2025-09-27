const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const { writeFileSync, mkdirSync, existsSync } = require('fs');
const { join } = require('path');
const chalk = require('chalk');

const URL = 'http://localhost:5173'; // URL de développement Vite
const OUTPUT_DIR = join(__dirname, '../performance-reports');

// Créer le répertoire de sortie s'il n'existe pas
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function runLighthouse() {
  console.log(chalk.blue('Lancement de l\'audit de performance...'));
  
  // Lancer Chrome
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  
  // Options pour Lighthouse
  const options = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port
  };
  
  // Exécuter Lighthouse
  try {
    const runnerResult = await lighthouse(URL, options);
    
    // Générer le rapport
    const reportHtml = runnerResult.report;
    const date = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const reportPath = join(OUTPUT_DIR, `performance-report-${date}.html`);
    
    writeFileSync(reportPath, reportHtml);
    
    console.log(chalk.green(`\nRapport généré: ${reportPath}`));
    
    // Afficher les scores
    console.log(chalk.blue('\nScores:'));
    console.log(chalk.blue('------'));
    
    const categories = runnerResult.lhr.categories;
    
    const formatScore = (score) => {
      const percentage = Math.round(score * 100);
      if (percentage >= 90) return chalk.green(`${percentage}%`);
      if (percentage >= 50) return chalk.yellow(`${percentage}%`);
      return chalk.red(`${percentage}%`);
    };
    
    console.log(`Performance:     ${formatScore(categories.performance.score)}`);
    console.log(`Accessibilité:   ${formatScore(categories.accessibility.score)}`);
    console.log(`Bonnes pratiques: ${formatScore(categories['best-practices'].score)}`);
    console.log(`SEO:             ${formatScore(categories.seo.score)}`);
    
    // Afficher les opportunités d'amélioration
    if (categories.performance.score < 0.9) {
      console.log(chalk.yellow('\nOpportunités d\'amélioration de performance:'));
      runnerResult.lhr.audits['opportunities'].details?.items.forEach(item => {
        console.log(chalk.yellow(`- ${item.description}: ${item.wastedMs}ms`));
      });
    }
  } catch (error) {
    console.error(chalk.red('Erreur lors de l\'audit:'), error);
  } finally {
    // Fermer Chrome
    await chrome.kill();
  }
}

// Vérifier si le serveur de développement est en cours d'exécution
const isServerRunning = () => {
  try {
    require('http').get(URL, () => {
      runLighthouse();
    }).on('error', () => {
      console.error(chalk.red(`Le serveur de développement n'est pas en cours d'exécution sur ${URL}`));
      console.log(chalk.yellow('Veuillez démarrer le serveur avec `npm run dev` avant d\'exécuter l\'audit.'));
    });
  } catch (error) {
    console.error(chalk.red('Erreur lors de la vérification du serveur:'), error);
  }
};

isServerRunning();
