# Dockerfile pour CoworkMy
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./

# Installer toutes les dépendances (dev + prod) pour le build
RUN npm ci

# Copier le code source
COPY . .

# Construire l'application
RUN npm run build

# Supprimer les dépendances de développement
RUN npm prune --production

# Copier les fichiers statiques du frontend
COPY dist/ ./dist/

# Exposer le port
EXPOSE 5000

# Variables d'environnement
ENV NODE_ENV=production
ENV API_PORT=5000

# Commande de démarrage
CMD ["npm", "start"]
