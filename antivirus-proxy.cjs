const express = require('express');
const multer = require('multer');
const cors = require('cors');
const FormData = require('form-data');
require('dotenv').config();
// Import dynamique compatible CommonJS pour node-fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const upload = multer();
const PORT = process.env.PORT || 4000;
const METADEFENDER_API_KEY = process.env.METADEFENDER_API_KEY;

if (!METADEFENDER_API_KEY) {
  console.error('❌ Clé API MetaDefender manquante. Ajoute METADEFENDER_API_KEY=... dans ton .env');
  process.exit(1);
}

// Autorise le front local
app.use(cors({ origin: 'http://localhost:3000' }));

app.post('/scan-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier reçu' });
    }
    // 1. Upload vers MetaDefender
    const formData = new FormData();
    formData.append('file', req.file.buffer, { filename: req.file.originalname });
    const uploadResp = await fetch('https://api.metadefender.com/v4/file', {
      method: 'POST',
      headers: { apikey: METADEFENDER_API_KEY, ...formData.getHeaders() },
      body: formData
    });
    if (!uploadResp.ok) {
      const err = await uploadResp.text();
      return res.status(500).json({ error: 'Erreur upload MetaDefender', details: err });
    }
    const uploadData = await uploadResp.json();
    const dataId = uploadData.data_id;
    // 2. Polling pour le résultat
    let report = null;
    for (let i = 0; i < 10; i++) {
      const reportResp = await fetch(`https://api.metadefender.com/v4/file/${dataId}`, {
        headers: { apikey: METADEFENDER_API_KEY }
      });
      const reportData = await reportResp.json();
      if (reportData.scan_results && reportData.scan_results.progress_percentage === 100) {
        report = reportData;
        break;
      }
      await new Promise(r => setTimeout(r, 2000));
    }
    if (!report) {
      return res.status(504).json({ error: 'Timeout lors de l\'analyse antivirus' });
    }
    res.json(report);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur', details: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚦 Antivirus proxy lancé sur http://localhost:${PORT}`);
}); 