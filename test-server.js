const express = require('express');
const app = express();

// Middleware pour logs
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip}`);
    next();
});

// Route simple
app.get('/', (req, res) => {
    res.send(`
        <h1>🎯 Test Server</h1>
        <p>Serveur accessible depuis: ${req.ip}</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
        <p>Si vous voyez cette page, le serveur fonctionne !</p>
    `);
});

// Écoute sur toutes les interfaces
app.listen(3099, '0.0.0.0', () => {
    console.log('🚀 Serveur de test démarré sur le port 3099');
    console.log('📱 Accessible sur: http://10.2.164.27:3099');
});
