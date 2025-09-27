// Service d'analyse antivirus avec VirusTotal API
// VirusTotal offre 500 requêtes gratuites par jour

interface VirusTotalResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      stats: {
        malicious: number;
        suspicious: number;
        undetected: number;
        harmless: number;
        timeout: number;
      };
      results: Record<string, {
        category: string;
        engine_name: string;
        engine_version: string;
        result: string | null;
        method: string;
        engine_update: string;
      }>;
      scan_date: number;
      file_info: {
        size: number;
        md5: string;
        sha1: string;
        sha256: string;
      };
    };
  };
}

interface ScanResult {
  isClean: boolean;
  threat?: string;
  details?: {
    malicious: number;
    suspicious: number;
    total: number;
    engines: string[];
  };
  scanId?: string;
}

class VirusTotalScanner {
  private apiKey: string;
  private baseUrl = 'https://www.virustotal.com/api/v3';
  private maxFileSize = 32 * 1024 * 1024; // 32MB limite VirusTotal gratuit

  constructor() {
    // Clé API VirusTotal (à configurer dans les variables d'environnement)
    this.apiKey = process.env.NEXT_PUBLIC_VIRUSTOTAL_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ Clé API VirusTotal non configurée. Utilisation du scanner basique.');
    }
  }

  /**
   * Scanne un fichier avec VirusTotal
   */
  async scanFile(file: File): Promise<ScanResult> {
    try {
      // Vérifier la taille du fichier
      if (file.size > this.maxFileSize) {
        return {
          isClean: false,
          threat: `Fichier trop volumineux pour l'analyse (max ${this.maxFileSize / 1024 / 1024}MB)`
        };
      }

      // Si pas de clé API, utiliser le scanner basique
      if (!this.apiKey) {
        return await this.basicScan(file);
      }

      // 1. Calculer le hash du fichier pour vérifier s'il existe déjà
      const fileHash = await this.calculateSHA256(file);
      
      // 2. Vérifier si le fichier a déjà été scanné
      const existingReport = await this.getFileReport(fileHash);
      if (existingReport) {
        return this.parseVirusTotalResponse(existingReport);
      }

      // 3. Uploader et scanner le fichier
      const scanId = await this.uploadFile(file);
      if (!scanId) {
        return {
          isClean: false,
          threat: 'Erreur lors de l\'upload vers VirusTotal'
        };
      }

      // 4. Attendre et récupérer le résultat
      const report = await this.waitForScanResult(scanId);
      if (!report) {
        return {
          isClean: false,
          threat: 'Timeout lors de l\'analyse antivirus'
        };
      }

      return this.parseVirusTotalResponse(report);

    } catch (error) {
      console.error('Erreur lors du scan VirusTotal:', error);
      
      // Fallback vers le scanner basique
      return await this.basicScan(file);
    }
  }

  /**
   * Upload un fichier vers VirusTotal
   */
  private async uploadFile(file: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/files`, {
        method: 'POST',
        headers: {
          'X-Apikey': this.apiKey
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data?.id || null;
    } catch (error) {
      console.error('Erreur upload VirusTotal:', error);
      return null;
    }
  }

  /**
   * Récupère le rapport d'un fichier par son hash
   */
  private async getFileReport(hash: string): Promise<VirusTotalResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/files/${hash}`, {
        headers: {
          'X-Apikey': this.apiKey
        }
      });

      if (response.status === 404) {
        return null; // Fichier pas encore scanné
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur récupération rapport:', error);
      return null;
    }
  }

  /**
   * Attend le résultat du scan
   */
  private async waitForScanResult(scanId: string, maxAttempts = 10): Promise<VirusTotalResponse | null> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/analyses/${scanId}`, {
          headers: {
            'X-Apikey': this.apiKey
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.data?.attributes?.status === 'completed') {
          // Récupérer le rapport complet
          const fileId = data.data.meta?.file_info?.sha256;
          if (fileId) {
            return await this.getFileReport(fileId);
          }
        }

        // Attendre avant le prochain essai
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Tentative ${attempt + 1} échouée:`, error);
      }
    }

    return null;
  }

  /**
   * Parse la réponse VirusTotal
   */
  private parseVirusTotalResponse(response: VirusTotalResponse): ScanResult {
    const stats = response.data.attributes.stats;
    const results = response.data.attributes.results;
    
    const malicious = stats.malicious || 0;
    const suspicious = stats.suspicious || 0;
    const total = Object.keys(results).length;

    // Récupérer les moteurs qui ont détecté des menaces
    const threatsDetected = Object.entries(results)
      .filter(([_, result]) => result.category === 'malicious' || result.category === 'suspicious')
      .map(([engine, result]) => `${engine}: ${result.result}`);

    const isClean = malicious === 0 && suspicious === 0;

    return {
      isClean,
      threat: !isClean ? `Menaces détectées par ${malicious + suspicious} moteur(s)` : undefined,
      details: {
        malicious,
        suspicious,
        total,
        engines: threatsDetected
      },
      scanId: response.data.id
    };
  }

  /**
   * Scanner basique (fallback)
   */
  private async basicScan(file: File): Promise<ScanResult> {
    try {
      const buffer = await file.arrayBuffer();
      const content = new Uint8Array(buffer);
      
      // Signatures de malware connues
      const malwareSignatures = [
        [0x4D, 0x5A, 0x90, 0x00], // PE executable
        [0x7F, 0x45, 0x4C, 0x46], // ELF executable
        [0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00], // ZIP avec compression suspecte
      ];
      
      for (const signature of malwareSignatures) {
        if (this.containsSignature(content, signature)) {
          return {
            isClean: false,
            threat: 'Fichier exécutable ou archive suspecte détecté'
          };
        }
      }
      
      // Vérification du contenu textuel
      try {
        const fileContent = await file.text();
        const suspiciousStrings = [
          'eval(', 'exec(', 'system(', 'shell_exec', 'passthru',
          '<script', 'javascript:', 'vbscript:', 'onload=', 'onerror=',
          'cmd.exe', 'powershell', '/bin/sh', 'wget', 'curl',
          'base64_decode', 'gzinflate', 'str_rot13'
        ];
        
        const lowerContent = fileContent.toLowerCase();
        for (const suspicious of suspiciousStrings) {
          if (lowerContent.includes(suspicious)) {
            return {
              isClean: false,
              threat: `Code potentiellement malveillant détecté: ${suspicious}`
            };
          }
        }
      } catch {
        // Fichier binaire, pas de vérification textuelle
      }
      
      return { isClean: true };
    } catch (error) {
      console.error('Erreur scan basique:', error);
      return {
        isClean: false,
        threat: 'Erreur lors de l\'analyse de sécurité'
      };
    }
  }

  /**
   * Calcule le SHA256 d'un fichier
   */
  private async calculateSHA256(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Vérifie si un buffer contient une signature
   */
  private containsSignature(buffer: Uint8Array, signature: number[]): boolean {
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
  }

  /**
   * Vérifie si l'API est disponible
   */
  isApiAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Obtient les statistiques d'utilisation de l'API
   */
  async getApiUsage(): Promise<{ used: number; limit: number } | null> {
    if (!this.apiKey) return null;

    try {
      const response = await fetch(`${this.baseUrl}/users/${this.apiKey.substring(0, 8)}`, {
        headers: {
          'X-Apikey': this.apiKey
        }
      });

      if (!response.ok) return null;

      const data = await response.json();
      return {
        used: data.data?.attributes?.quotas?.api_requests_monthly?.used || 0,
        limit: data.data?.attributes?.quotas?.api_requests_monthly?.allowed || 500
      };
    } catch {
      return null;
    }
  }
}

// Instance singleton
export const virusTotalScanner = new VirusTotalScanner();

// Export des types
export type { ScanResult }; 