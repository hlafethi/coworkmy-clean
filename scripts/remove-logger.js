import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fonction pour traiter un fichier
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Supprimer les imports de logger
    const loggerImportRegex = /import\s*{\s*logger\s*}\s*from\s*['"]@\/utils\/logger['"];?\s*\n?/g;
    if (content.match(loggerImportRegex)) {
      content = content.replace(loggerImportRegex, '');
      modified = true;
    }

    // Remplacer logger.debug par console.log
    if (content.includes('logger.debug')) {
      content = content.replace(/logger\.debug/g, 'console.log');
      modified = true;
    }

    // Remplacer logger.info par console.log
    if (content.includes('logger.info')) {
      content = content.replace(/logger\.info/g, 'console.log');
      modified = true;
    }

    // Remplacer logger.warn par console.warn
    if (content.includes('logger.warn')) {
      content = content.replace(/logger\.warn/g, 'console.warn');
      modified = true;
    }

    // Remplacer logger.error par console.error
    if (content.includes('logger.error')) {
      content = content.replace(/logger\.error/g, 'console.error');
      modified = true;
    }

    // Remplacer logger.dev par console.log
    if (content.includes('logger.dev')) {
      content = content.replace(/logger\.dev/g, 'console.log');
      modified = true;
    }

    // Remplacer logger.log par console.log
    if (content.includes('logger.log')) {
      content = content.replace(/logger\.log/g, 'console.log');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Traité: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Erreur avec ${filePath}:`, error.message);
  }
}

// Fonction récursive pour parcourir les dossiers
function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      processDirectory(fullPath);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

// Traiter le dossier src
const srcPath = path.join(__dirname, '..', 'src');
console.log('🧹 Suppression des références au logger...');
processDirectory(srcPath);
console.log('✅ Terminé !');
