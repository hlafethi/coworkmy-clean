// scripts/check-accessibility.js
import puppeteer from 'puppeteer';
import AxePuppeteer from '@axe-core/puppeteer';
import chalk from 'chalk';
import http from 'http';

async function runAccessibilityAudit() {
  console.log(chalk.blue('🔍 Démarrage de l\'audit d\'accessibilité...'));
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Aller sur la page
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Attendre que l'app soit complètement chargée
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Exécuter axe
    const results = await new AxePuppeteer(page).analyze();
    
    console.log(chalk.green(`\n✅ Audit terminé !`));
    console.log(chalk.blue(`📊 Résultats:`));
    console.log(`   • ${chalk.green(results.passes.length)} tests réussis`);
    console.log(`   • ${chalk.yellow(results.incomplete.length)} tests incomplets`);
    console.log(`   • ${chalk.red(results.violations.length)} violations trouvées`);
    
    if (results.violations.length > 0) {
      console.log(chalk.red('\n🚨 Violations détectées:'));
      
      results.violations.forEach((violation, index) => {
        console.log(chalk.red(`\n${index + 1}. ${violation.description}`));
        console.log(chalk.gray(`   Impact: ${violation.impact}`));
        console.log(chalk.gray(`   Tags: ${violation.tags.join(', ')}`));
        console.log(chalk.blue(`   Aide: ${violation.helpUrl}`));
        
        if (violation.nodes.length > 0) {
          console.log(chalk.yellow(`   Éléments affectés (${violation.nodes.length}):`));
          violation.nodes.slice(0, 3).forEach(node => {
            console.log(chalk.gray(`   • ${node.html.substring(0, 100)}...`));
          });
        }
      });
      
      // Suggestions spécifiques
      const contrastViolations = results.violations.filter(v => v.id === 'color-contrast');
      if (contrastViolations.length > 0) {
        console.log(chalk.yellow('\n💡 Pour corriger les problèmes de contraste:'));
        console.log(chalk.yellow('   1. Utilisez des couleurs plus foncées pour le texte'));
        console.log(chalk.yellow('   2. Assurez-vous d\'un ratio de contraste ≥ 4.5:1'));
        console.log(chalk.yellow('   3. Testez avec: https://webaim.org/resources/contrastchecker/'));
      }
    } else {
      console.log(chalk.green('\n🎉 Aucune violation d\'accessibilité trouvée !'));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Erreur lors de l\'audit:'), error);
  } finally {
    await browser.close();
  }
}

// Vérifier si le serveur tourne
http.get('http://localhost:3000', () => {
  runAccessibilityAudit();
}).on('error', () => {
  console.error(chalk.red('❌ Le serveur de développement n\'est pas démarré sur http://localhost:3000'));
  console.log(chalk.yellow('💡 Démarrez-le avec: npm run dev'));
}); 