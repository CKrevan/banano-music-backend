const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/files', express.static('/tmp'));

app.get('/', (req, res) => {
    res.json({ status: 'Banano Music Backend funcionando 🎵' });
});

// Ruta para listar formatos de audio
app.post('/audio-formats', (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL requerida' });

    const command = `yt-dlp -F --no-warnings "${url}"`;

    exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
        if (error || stderr.includes('ERROR')) {
            console.error(stderr);
            return res.status(500).json({ error: 'No se pudieron listar formatos' });
        }

        const lines = stdout.split('\n');
        const formats = [];
        let started = false;
        for (const line of lines) {
            if (line.includes('audio only')) started = true;
            if (started && line.match(/^\s*\d+/)) {
                const parts = line.trim().split(/\s+/);
                const id = parts[0];
                const ext = parts[1];
                const quality = parts.slice(2).join(' ');
                formats.push({
                    id,
                    ext,
                    quality,
                    url: `https://${req.get('host')}/download-audio?id=${id}&url=${encodeURIComponent(url)}`
                });
            }
        }

        res.json({ formats });
    });
});

// Ruta para descargar el audio elegido
app.get('/download-audio', (req, res) => {
    const { id, url } = req.query;
    if (!id || !url) return res.status(400).json({ error: 'Falta id o url' });

    const filename = `audio_${Date.now()}`;
    const outputFile = `/tmp/${filename}`;

    const command = `yt-dlp -f "${id}" --extract-audio --audio-format best -o "${outputFile}" "${url}"`;

    exec(command, { timeout: 90000 }, (error, stdout, stderr) => {
        if (error) {
            console.error(stderr);
            return res.status(500).json({ error: 'Error al descargar audio' });
        }

        const possibleFiles = fs.readdirSync('/tmp').filter(f => f.startsWith(filename));
        if (possibleFiles.length === 0) return res.status(500).json({ error: 'Archivo no generado' });

        const filePath = `/tmp/${possibleFiles[0]}`;
        const audioUrl = `https://${req.get('host')}/files/${possibleFiles[0]}`;
        res.json({ url: audioUrl });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
