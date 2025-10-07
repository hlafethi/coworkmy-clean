// Logger supprimé - utilisation de console directement
// Service d'analyse antivirus avec MetaDefender Cloud (OPSWAT)
// Doc: https://onlinehelp.opswat.com/mdcloud/Getting_Started_with_MetaDefender_Cloud_REST_API.html

export interface ScanResult {
  isClean: boolean;
  threat?: string;
  details?: any;
  scanId?: string;
}

class MetaDefenderScanner {
  private apiKey: string;
  private baseUrl = 'https://api.metadefender.com/v4';
  private maxFileSize = 20 * 1024 * 1024; // 20MB limite gratuite

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_METADEFENDER_API_KEY || (typeof import.meta !== 'undefined' ? import.meta.env.VITE_METADEFENDER_API_KEY : '') || '';
    console.log('METADEFENDER API KEY utilisée:', this.apiKey);
    if (!this.apiKey) {
      console.warn('⚠️ Clé API MetaDefender non configurée. Utilisation du scanner basique.');
    }
  }

  async scanFile(file: File): Promise<ScanResult> {
    try {
      if (file.size > this.maxFileSize) {
        return {
          isClean: false,
          threat: `Fichier trop volumineux pour l'analyse (max ${this.maxFileSize / 1024 / 1024}MB)`
        };
      }
      if (!this.apiKey) {
        return await this.basicScan(file);
      }
      // 1. Upload du fichier
      const dataId = await this.uploadFile(file);
      if (!dataId) {
        return { isClean: false, threat: "Erreur lors de l'upload vers MetaDefender" };
      }
      // 2. Polling pour le résultat
      const report = await this.pollForResult(dataId);
      if (!report) {
        return { isClean: false, threat: "Timeout lors de l'analyse antivirus" };
      }
      console.log('Réponse MetaDefender:', report);
      return this.parseMetaDefenderResponse(report, dataId);
    } catch (error) {
      console.error('Erreur lors du scan MetaDefender:', error);
      return await this.basicScan(file);
    }
  }

  private async uploadFile(file: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${this.baseUrl}/file`, {
        method: 'POST',
        headers: {
          apikey: this.apiKey
        },
        body: formData
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      return data.data_id || null;
    } catch (error) {
      console.error('Erreur upload MetaDefender:', error);
      return null;
    }
  }

  private async pollForResult(dataId: string, maxAttempts = 10): Promise<any | null> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/file/${dataId}`, {
          headers: { apikey: this.apiKey }
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        if (data.scan_results && data.scan_results.progress_percentage === 100) {
          return data;
        }
        // Attendre avant le prochain essai
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Tentative ${attempt + 1} échouée:`, error);
      }
    }
    return null;
  }

  private parseMetaDefenderResponse(response: any, dataId: string): ScanResult {
    if (!response || !response.scan_results) {
      return {
        isClean: false,
        threat: "Réponse MetaDefender invalide ou incomplète",
        details: undefined,
        scanId: dataId
      };
    }
    const scan = response.scan_results;
    const infected = scan.total_detected_avs || 0;
    const total = scan.total_avs || 0;
    const engines = (scan.scan_details && Object.entries(scan.scan_details)
      .filter(([_, d]: any) => d.threat_found && d.threat_found !== "")
      .map(([engine, d]: any) => `${engine}: ${d.threat_found}`)) || [];
    const isClean = infected === 0;
    return {
      isClean,
      threat: !isClean ? `Menaces détectées par ${infected} moteur(s)` : undefined,
      details: {
        infected,
        total,
        engines
      },
      scanId: dataId
    };
  }

  // Scanner basique (fallback)
  private async basicScan(file: File): Promise<ScanResult> {
    try {
      const buffer = await file.arrayBuffer();
      const content = new Uint8Array(buffer);
      // Simple heuristique : recherche de signatures PE/EXE
      const isExe = content[0] === 0x4D && content[1] === 0x5A; // 'MZ'
      return {
        isClean: !isExe,
        threat: isExe ? 'Fichier exécutable détecté (scan local)' : undefined
      };
    } catch (e) {
      return { isClean: true };
    }
  }
}

export const metaDefenderScanner = new MetaDefenderScanner(); 