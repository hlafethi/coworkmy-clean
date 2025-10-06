import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonction pour remplacer les console.log dans un fichier
function replaceConsoleLogsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Remplacer console.log par logger.debug
    const consoleLogRegex = /console\.log\(/g;
    if (consoleLogRegex.test(content)) {
      content = content.replace(consoleLogRegex, 'logger.debug(');
      modified = true;
    }

    // Remplacer console.error par logger.error
    const consoleErrorRegex = /console\.error\(/g;
    if (consoleErrorRegex.test(content)) {
      content = content.replace(consoleErrorRegex, 'logger.error(');
      modified = true;
    }

    // Remplacer console.warn par logger.warn
    const consoleWarnRegex = /console\.warn\(/g;
    if (consoleWarnRegex.test(content)) {
      content = content.replace(consoleWarnRegex, 'logger.warn(');
      modified = true;
    }

    // Ajouter l'import du logger si nécessaire
    if (modified && !content.includes('import { logger }')) {
      // Trouver la première ligne d'import
      const lines = content.split('\n');
      let insertIndex = 0;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ') || lines[i].startsWith('import{')) {
          insertIndex = i + 1;
        }
      }
      
      lines.splice(insertIndex, 0, "import { logger } from '@/utils/logger';");
      content = lines.join('\n');
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Modifié: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Erreur avec ${filePath}:`, error.message);
  }
}

// Fonction pour parcourir récursivement les dossiers
function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      processDirectory(fullPath);
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      replaceConsoleLogsInFile(fullPath);
    }
  }
}

// Traiter le dossier src
const srcPath = path.join(__dirname, '..', 'src');
console.log('🔄 Remplacement des console.log par logger...');
processDirectory(srcPath);
console.log('✅ Remplacement terminé !');
