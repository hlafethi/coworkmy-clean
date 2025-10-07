// Logger supprimé - utilisation de console directement
// Types de fichiers autorisés
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  spreadsheets: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  text: ['text/plain', 'text/csv']
};

// Extensions autorisées
export const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'
];

// Taille maximale des fichiers (en bytes)
export const MAX_FILE_SIZE = {
  image: 5 * 1024 * 1024, // 5MB
  document: 10 * 1024 * 1024, // 10MB
  default: 5 * 1024 * 1024 // 5MB
};

// Signatures de fichiers (magic numbers) pour détecter le vrai type
export const FILE_SIGNATURES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
  'application/zip': [0x50, 0x4B, 0x03, 0x04], // Pour les fichiers Office modernes
};

// Noms de fichiers dangereux
export const DANGEROUS_FILENAMES = [
  'autorun.inf', 'desktop.ini', 'thumbs.db', '.htaccess', 'web.config',
  'index.php', 'index.html', 'index.htm'
];

// Extensions dangereuses
export const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.php', '.asp', '.aspx', '.jsp', '.sh', '.ps1', '.py', '.rb'
];

/**
 * Valide un fichier avant upload
 */
export const validateFile = async (file: File): Promise<{ isValid: boolean; error?: string }> => {
  try {
    // 1. Vérifier la taille
    const maxSize = getMaxSizeForType(file.type);
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `Le fichier est trop volumineux. Taille maximale: ${formatFileSize(maxSize)}`
      };
    }

    // 2. Vérifier l'extension
    const extension = getFileExtension(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return {
        isValid: false,
        error: `Extension de fichier non autorisée: ${extension}`
      };
    }

    // 3. Vérifier les extensions dangereuses
    if (DANGEROUS_EXTENSIONS.includes(extension)) {
      return {
        isValid: false,
        error: 'Type de fichier potentiellement dangereux détecté'
      };
    }

    // 4. Vérifier le nom de fichier
    if (DANGEROUS_FILENAMES.includes(file.name.toLowerCase())) {
      return {
        isValid: false,
        error: 'Nom de fichier non autorisé'
      };
    }

    // 5. Vérifier le type MIME
    if (!isAllowedMimeType(file.type)) {
      return {
        isValid: false,
        error: `Type de fichier non autorisé: ${file.type}`
      };
    }

    // 6. Vérifier la signature du fichier (magic numbers)
    const isValidSignature = await validateFileSignature(file);
    if (!isValidSignature) {
      return {
        isValid: false,
        error: 'Le contenu du fichier ne correspond pas à son extension'
      };
    }

    // 7. Scanner le nom pour des caractères suspects
    if (containsSuspiciousCharacters(file.name)) {
      return {
        isValid: false,
        error: 'Le nom du fichier contient des caractères non autorisés'
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Erreur lors de la validation du fichier:', error);
    return {
      isValid: false,
      error: 'Erreur lors de la validation du fichier'
    };
  }
};

/**
 * Valide la signature d'un fichier
 */
const validateFileSignature = async (file: File): Promise<boolean> => {
  try {
    const buffer = await file.slice(0, 8).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    const signature = FILE_SIGNATURES[file.type as keyof typeof FILE_SIGNATURES];
    if (!signature) return true; // Pas de signature définie, on accepte
    
    for (let i = 0; i < signature.length; i++) {
      if (bytes[i] !== signature[i]) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la validation de la signature:', error);
    return false;
  }
};

/**
 * Vérifie si le type MIME est autorisé
 */
const isAllowedMimeType = (mimeType: string): boolean => {
  const allAllowedTypes = [
    ...ALLOWED_FILE_TYPES.images,
    ...ALLOWED_FILE_TYPES.documents,
    ...ALLOWED_FILE_TYPES.spreadsheets,
    ...ALLOWED_FILE_TYPES.text
  ];
  
  return allAllowedTypes.includes(mimeType);
};

/**
 * Obtient la taille maximale pour un type de fichier
 */
const getMaxSizeForType = (mimeType: string): number => {
  if (ALLOWED_FILE_TYPES.images.includes(mimeType)) {
    return MAX_FILE_SIZE.image;
  }
  if (ALLOWED_FILE_TYPES.documents.includes(mimeType) || 
      ALLOWED_FILE_TYPES.spreadsheets.includes(mimeType)) {
    return MAX_FILE_SIZE.document;
  }
  return MAX_FILE_SIZE.default;
};

/**
 * Extrait l'extension d'un nom de fichier
 */
const getFileExtension = (filename: string): string => {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.substring(lastDot);
};

/**
 * Vérifie si le nom contient des caractères suspects
 */
const containsSuspiciousCharacters = (filename: string): boolean => {
  // Caractères dangereux dans les noms de fichiers
  const suspiciousChars = /[<>:"|?*\x00-\x1f]/;
  const suspiciousPatterns = /\.\./; // Directory traversal
  
  return suspiciousChars.test(filename) || suspiciousPatterns.test(filename);
};

/**
 * Formate la taille d'un fichier
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Génère un nom de fichier sécurisé
 */
export const generateSecureFilename = (originalName: string, userId: string): string => {
  const extension = getFileExtension(originalName);
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  
  // Nettoyer le nom original
  const cleanName = originalName
    .replace(extension, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .substring(0, 50);
  
  return `${userId}_${timestamp}_${randomString}_${cleanName}${extension}`;
};

/**
 * Scan antivirus avec VirusTotal API
 */
export const scanFileForVirus = async (file: File): Promise<{ isClean: boolean; threat?: string; details?: any }> => {
  try {
    // Importer dynamiquement le scanner VirusTotal
    const { virusTotalScanner } = await import('./virusTotalScanner');
    
    // Utiliser VirusTotal pour le scan
    const result = await virusTotalScanner.scanFile(file);
    
    return {
      isClean: result.isClean,
      threat: result.threat,
      details: result.details
    };
  } catch (error) {
    console.error('Erreur lors du scan antivirus:', error);
    return {
      isClean: false,
      threat: 'Erreur lors du scan de sécurité'
    };
  }
};

/**
 * Vérifie si un buffer contient une signature
 */
const containsSignature = (buffer: Uint8Array, signature: number[]): boolean => {
  if (buffer.length < signature.length) return false;
  
  for (let i = 0; i <= buffer.length - signature.length; i++) {
    let match = true;
    for (let j = 0; j < signature.length; j++) {
      if (buffer[i + j] !== signature[j]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  
  return false;
};

/**
 * Configuration de sécurité pour Supabase Storage
 */
export const STORAGE_SECURITY_CONFIG = {
  // Politique de bucket
  bucketPolicy: {
    allowedMimeTypes: [
      ...ALLOWED_FILE_TYPES.images,
      ...ALLOWED_FILE_TYPES.documents,
      ...ALLOWED_FILE_TYPES.spreadsheets,
      ...ALLOWED_FILE_TYPES.text
    ],
    maxFileSize: MAX_FILE_SIZE.document,
    allowPublicRead: false, // Fichiers privés par défaut
  },
  
  // Headers de sécurité
  securityHeaders: {
    'Content-Security-Policy': "default-src 'none'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  }
}; 