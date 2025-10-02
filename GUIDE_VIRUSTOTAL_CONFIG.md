# Guide de Configuration VirusTotal

## 🔧 Configuration VirusTotal pour l'analyse de documents

### 1. Obtenir une clé API VirusTotal

1. **Créer un compte VirusTotal** :
   - Aller sur https://www.virustotal.com/
   - Cliquer sur "Sign up" et créer un compte gratuit
   - Vérifier votre email

2. **Obtenir la clé API** :
   - Se connecter à votre compte VirusTotal
   - Aller dans "Profile" → "API Key"
   - Copier votre clé API (format: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

### 2. Configuration dans l'application

#### Option A : Variables d'environnement (Recommandé)
Créer un fichier `.env` à la racine du projet :

```env
# Configuration VirusTotal
VITE_VIRUSTOTAL_API_KEY=votre_cle_api_virustotal_ici
```

#### Option B : Configuration directe
Modifier le fichier `src/utils/virusTotalScanner.ts` :

```typescript
constructor() {
  // Remplacer par votre vraie clé API
  this.apiKey = 'votre_cle_api_virustotal_ici';
  
  if (!this.apiKey) {
    console.warn('⚠️ Clé API VirusTotal non configurée. Utilisation du scanner basique.');
  }
}
```

### 3. Limites de l'API gratuite

- **500 requêtes par jour** (gratuit)
- **Taille max des fichiers** : 32MB
- **Types de fichiers supportés** : Tous les types
- **Délai d'analyse** : 1-2 minutes par fichier

### 4. Fonctionnalités disponibles

#### Scanner automatique
- ✅ Analyse de tous les documents uploadés
- ✅ Détection de malware, virus, trojans
- ✅ Scan avec 70+ moteurs antivirus
- ✅ Rapport détaillé des menaces

#### Types de documents analysés
- 📄 Documents PDF
- 📊 Fichiers Office (Word, Excel, PowerPoint)
- 🖼️ Images (JPG, PNG, GIF)
- 📦 Archives (ZIP, RAR, 7Z)
- 💻 Exécutables (EXE, MSI, APP)
- 📝 Fichiers texte

### 5. Interface utilisateur

#### Pour les utilisateurs
- Upload de documents dans le profil
- Indicateur de statut de scan (🟡 En cours, ✅ Propre, ❌ Infecté)
- Détails du scan disponibles

#### Pour les administrateurs
- Vue de tous les documents utilisateurs
- Statut de scan visible
- Détails des menaces détectées
- Historique des scans

### 6. Codes de statut

| Statut | Icône | Description |
|--------|-------|-------------|
| `pending` | 🟡 | Scan en cours |
| `clean` | ✅ | Fichier propre |
| `infected` | ❌ | Malware détecté |
| `error` | ⚠️ | Erreur de scan |

### 7. Exemple d'utilisation

```typescript
import { virusTotalScanner } from '@/utils/virusTotalScanner';

// Scanner un fichier
const result = await virusTotalScanner.scanFile(file);

if (result.isClean) {
  console.log('✅ Fichier propre');
} else {
  console.log('❌ Menace détectée:', result.threat);
  console.log('🔍 Détails:', result.details);
}
```

### 8. Dépannage

#### Problème : "Clé API non configurée"
- Vérifier que `VITE_VIRUSTOTAL_API_KEY` est définie
- Redémarrer l'application après modification

#### Problème : "Quota dépassé"
- Attendre le lendemain (reset quotidien)
- Ou passer à un plan payant VirusTotal

#### Problème : "Fichier trop volumineux"
- Limite gratuite : 32MB
- Compresser le fichier ou utiliser un plan payant

### 9. Sécurité

- ✅ Clé API stockée côté client (sécurisé)
- ✅ Pas de stockage permanent des fichiers
- ✅ Scan en temps réel
- ✅ Rapport détaillé des menaces

### 10. Monitoring

```typescript
// Vérifier l'utilisation de l'API
const usage = await virusTotalScanner.getApiUsage();
console.log(`Utilisé: ${usage.used}/${usage.limit} requêtes`);
```

## 🚀 Mise en production

1. **Configurer la clé API** dans les variables d'environnement
2. **Tester l'upload** d'un document
3. **Vérifier le scan** dans l'interface admin
4. **Monitorer l'utilisation** de l'API

---

**Note** : En mode développement, un scanner basique est utilisé si VirusTotal n'est pas configuré.
