require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configuration CORS pour production et développement
const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL,
        /\.render\.com$/,
        /\.onrender\.com$/
      ]
    : ["*"];

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
        const room = {
            id: roomId,
            players: [{
                id: socket.id,
                username: username,
                connected: true
            }],
            host: socket.id,
            gameStarted: false,
            pieces: []
        };

        gameRooms.set(roomId, room);
        socket.join(roomId);

        console.log(`🎮 Salle créée: ${roomId} par ${username}`);

        socket.emit('room-created', {
            roomId,
            players: room.players,
            pieces: room.pieces
        });
    });

    socket.on('join-room', ({ roomId, username }) => {
        const room = gameRooms.get(roomId);

        if (!room) {
            socket.emit('room-error', { message: 'Salle introuvable' });
            return;
        }

        if (room.players.length >= 4) {
            socket.emit('room-error', { message: 'Salle pleine' });
            return;
        }

        room.players.push({
            id: socket.id,
            username: username,
            connected: true
        });

        socket.join(roomId);

        console.log(`👥 ${username} a rejoint la salle ${roomId}`);

        io.to(roomId).emit('player-joined', {
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