const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ status: 'Banano Music Backend funcionando 🎵' });
});

// Ruta para listar formatos de audio (versión definitiva que siempre encuentra audio)
app.post('/audio-formats', (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL requerida' });

    // Comando definitivo: lista todos los formatos de audio con URL directa
    const command = `yt-dlp -f "ba" --print "%(id)s|%(ext)s|%(format_note)s|%(filesize_approx)s|%(url)s" "${url}"`;

    exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
        if (error || stderr.includes('ERROR')) {
            console.error(stderr || error);
            return res.status(500).json({ error: 'No se pudieron listar formatos' });
        }

        const lines = stdout.trim().split('\n').filter(line => line.trim());
        const formats = lines.map(line => {
            const [id, ext, quality, size, url] = line.split('|');
            return {
                id,
                ext,
                quality: quality || 'Audio',
                size: size && size !== 'N/A' ? (parseInt(size) / 1024 / 1024).toFixed(1) + ' MB' : 'Desconocido',
                url
            };
        });

        if (formats.length === 0) {
            return res.status(500).json({ error: 'No se encontraron formatos de audio (prueba otro enlace)' });
        }

        res.json({ formats });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
