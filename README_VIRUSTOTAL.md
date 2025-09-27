# 🛡️ Configuration VirusTotal API

## Qu'est-ce que VirusTotal ?

VirusTotal est un service gratuit de Google qui analyse les fichiers avec plus de 70 moteurs antivirus différents. Il offre une protection robuste contre les malwares, virus, et fichiers suspects.

## 🆓 Compte gratuit

- **500 requêtes par mois** gratuitement
- Analyse avec 70+ moteurs antivirus
- Détection de malware, virus, trojans, etc.
- API REST simple à utiliser

## 📋 Configuration

### 1. Créer un compte VirusTotal

1. Allez sur [VirusTotal](https://www.virustotal.com/gui/join-us)
2. Créez un compte gratuit
3. Confirmez votre email

### 2. Obtenir votre clé API

1. Connectez-vous à votre compte VirusTotal
2. Allez dans votre profil (coin supérieur droit)
3. Cliquez sur "API Key"
4. Copiez votre clé API

### 3. Configurer l'application

Ajoutez votre clé API dans votre fichier `.env.local` :

```bash
# VirusTotal API Configuration
NEXT_PUBLIC_VIRUSTOTAL_API_KEY=votre_cle_api_ici
```

### 4. Redémarrer l'application

```bash
npm run dev
```

## 🔧 Fonctionnement

### Avec API configurée
- ✅ Scan avec 70+ moteurs antivirus
- ✅ Détection avancée de malware
- ✅ Rapports détaillés
- ✅ Cache intelligent (fichiers déjà scannés)
- ✅ Monitoring du quota

### Sans API (fallback)
- ⚠️ Scanner basique local
- ⚠️ Détection limitée
- ⚠️ Signatures basiques seulement

## 📊 Monitoring

L'application inclut un dashboard de monitoring qui affiche :

- Statut de connexion à l'API
- Utilisation du quota mensuel
- Alertes quand le quota approche
- Statistiques de sécurité

## 🚨 Limites du compte gratuit

- **500 requêtes/mois** maximum
- **32MB** taille maximale par fichier
- **4 requêtes/minute** maximum

## 💡 Conseils d'optimisation

1. **Cache intelligent** : Les fichiers déjà scannés ne consomment pas de quota
2. **Fallback automatique** : Si le quota est épuisé, le scanner basique prend le relais
3. **Monitoring** : Surveillez votre utilisation dans le dashboard admin

## 🔐 Sécurité

- La clé API est stockée côté client (NEXT_PUBLIC_*)
- Aucune donnée sensible n'est envoyée à VirusTotal
- Les fichiers sont scannés mais pas stockés par VirusTotal
- Politique de confidentialité : [VirusTotal Privacy Policy](https://support.virustotal.com/hc/en-us/articles/115002168385-Privacy-Policy)

## 🆘 Dépannage

### Erreur "API Key invalide"
- Vérifiez que votre clé API est correcte
- Assurez-vous qu'elle commence par votre nom d'utilisateur

### Quota épuisé
- Attendez le mois suivant pour le renouvellement
- Le scanner basique continue de fonctionner

### Fichier trop volumineux
- VirusTotal gratuit limite à 32MB
- Les fichiers plus gros utilisent le scanner basique

## 📈 Upgrade vers un compte payant

Si vous avez besoin de plus de requêtes :

1. [VirusTotal Premium](https://www.virustotal.com/gui/intelligence-overview)
2. Jusqu'à 1000 requêtes/jour
3. Fichiers jusqu'à 650MB
4. API plus rapide

## 🔗 Liens utiles

- [Documentation API VirusTotal](https://developers.virustotal.com/reference/overview)
- [Créer un compte gratuit](https://www.virustotal.com/gui/join-us)
- [Support VirusTotal](https://support.virustotal.com/)

---

**Note** : VirusTotal est un service tiers. Assurez-vous de respecter leurs conditions d'utilisation. 