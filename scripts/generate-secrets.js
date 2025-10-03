import crypto from 'crypto';

console.log('🔐 Génération de clés sécurisées pour la production');
console.log('='.repeat(60));

// Générer un JWT secret fort
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET=' + jwtSecret);
console.log('');

// Générer une clé de session
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('SESSION_SECRET=' + sessionSecret);
console.log('');

// Générer une clé CSRF
const csrfSecret = crypto.randomBytes(32).toString('hex');
console.log('CSRF_SECRET=' + csrfSecret);
console.log('');

console.log('⚠️  IMPORTANT:');
console.log('- Copiez ces clés dans votre fichier .env');
console.log('- Ne partagez JAMAIS ces clés');
console.log('- Utilisez des clés différentes pour chaque environnement');
console.log('- Stockez-les de manière sécurisée en production');
