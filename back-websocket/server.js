require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { generatePuzzlePieces } = require('./utils/puzzleGenerator');

const app = express();
const server = http.createServer(app);

// Configuration CORS pour production et développement
const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL,
        /\.render\.com$/,
        /\.onrender\.com$/
      ]
    : [
        "http://localhost:3000",
        "http://localhost:3002", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3002",
        "http://10.2.164.27:3000",
        "http://10.2.164.27:3002"
      ];

console.log('🔧 CORS Origins autorisées:', allowedOrigins);

app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
}));

const io = socketIo(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

const gameRooms = new Map();

// Route de test pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
    res.json({
        message: '🎮 Serveur de puzzle collaboratif actif !',
        status: 'running',
        port: PORT,
        rooms: gameRooms.size,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', rooms: gameRooms.size });
});

function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
    console.log('👤 Utilisateur connecté:', socket.id);

    socket.on('create-room', ({ username }) => {
        const roomId = generateRoomId();
        
        // Configuration du puzzle
        const puzzleConfig = {
            gridSize: { rows: 3, cols: 3 }, // Puzzle 3x3 pour commencer
            pieceSize: { width: 100, height: 100 },
            boardSize: { width: 800, height: 600 }
        };
        
        // Génération des pièces de puzzle
        const puzzlePieces = generatePuzzlePieces(puzzleConfig);
        
        const room = {
            id: roomId,
            players: [{
                id: socket.id,
                username: username,
                connected: true
            }],
            host: socket.id,
            gameStarted: false,
            pieces: puzzlePieces,
            config: puzzleConfig
        };

        gameRooms.set(roomId, room);
        socket.join(roomId);

        console.log(`🎮 Salle créée: ${roomId} par ${username} (${room.players.length}/4 joueurs)`);
        console.log(`🧩 Puzzle généré: ${puzzlePieces.length} pièces`);
        console.log(`📊 Total des salles actives: ${gameRooms.size}`);

        socket.emit('room-created', {
            roomId,
            players: room.players,
            pieces: room.pieces
        });
    });

    socket.on('join-room', ({ roomId, username }) => {
        const room = gameRooms.get(roomId);

        if (!room) {
            console.log(`❌ Salle introuvable: ${roomId}`);
            socket.emit('room-error', { message: 'Salle introuvable' });
            return;
        }

        if (room.players.length >= 4) {
            console.log(`❌ Salle pleine: ${roomId}`);
            socket.emit('room-error', { message: 'Salle pleine' });
            return;
        }

        // Vérifier si le joueur n'est pas déjà dans la salle
        const existingPlayer = room.players.find(p => p.id === socket.id);
        if (existingPlayer) {
            console.log(`⚠️ Joueur déjà dans la salle: ${username}`);
            socket.emit('player-joined', {
                roomId,
                players: room.players,
                pieces: room.pieces
            });
            return;
        }

        room.players.push({
            id: socket.id,
            username: username,
            connected: true
        });

        socket.join(roomId);

        console.log(`👥 ${username} a rejoint la salle ${roomId} (${room.players.length}/4 joueurs)`);
        console.log(`🎯 Joueurs dans ${roomId}:`, room.players.map(p => p.username));

        // Envoyer l'événement à TOUS les joueurs de la salle (y compris celui qui vient de rejoindre)
        io.to(roomId).emit('player-joined', {
            roomId,
            players: room.players,
            pieces: room.pieces
        });
    });

    socket.on('disconnect', () => {
        console.log('👋 Utilisateur déconnecté:', socket.id);

        gameRooms.forEach((room, roomId) => {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                room.players.splice(playerIndex, 1);

                if (room.players.length === 0) {
                    gameRooms.delete(roomId);
                } else {
                    io.to(roomId).emit('player-left', { players: room.players });
                }
            }
        });
    });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Serveur backend démarré sur le port ${PORT}`);
    console.log(`🌐 Serveur accessible sur : ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
    
    if (process.env.NODE_ENV === 'production') {
        console.log(`🚀 Mode production - Render deployment`);
    } else {
        console.log(`� Mode développement local`);
        console.log(`🌐 Accessible réseau : http://10.2.164.27:${PORT}`);
    }
});