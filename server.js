const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ status: 'Banano Music Backend funcionando 🎵' });
});

// Ruta para listar formatos de audio (versión definitiva con --print)
app.post('/audio-formats', (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL requerida' });

    // Comando definitivo: solo audio, con tamaño y URL directa
    const command = `yt-dlp --print "%(id)s|%(ext)s|%(format_note)s|%(filesize_approx)s|%(url)s" -f "bestaudio" "${url}"`;

    exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
        if (error || stderr.includes('ERROR')) {
            console.error(stderr);
            return res.status(500).json({ error: 'No se pudieron listar formatos' });
        }

        const lines = stdout.trim().split('\n');
        const formats = lines.map(line => {
            const [id, ext, quality, size, url] = line.split('|');
            return {
                id,
                ext,
                quality: quality || 'Audio',
                size: size && size !== 'N/A' ? (size / 1024 / 1024).toFixed(1) + ' MB' : 'Desconocido',
                url
            };
        });

        if (formats.length === 0 || formats[0].url === 'N/A') {
            return res.status(500).json({ error: 'No se encontraron formatos de audio (prueba otro enlace)' });
        }

        res.json({ formats });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
// Redeploy forzado para arreglar yt-dlp
