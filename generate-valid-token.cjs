const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key'; // Même secret que dans server.js

// Créer un token valide pour l'utilisateur
const user = {
  id: 'f6682b18-7d10-4016-be08-885e989cffca',
  email: 'user@heleam.com',
  is_admin: false
};

const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });

console.log('🔑 Token généré:');
console.log(token);

// Vérifier que le token est valide
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('\n✅ Token décodé avec succès:');
  console.log(decoded);
} catch (error) {
  console.log('\n❌ Erreur de décodage:', error.message);
}
