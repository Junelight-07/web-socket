const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Configuration CORS ouverte pour le réseau
app.use(cors({
    origin: "*",
    methods: ["GET", "POST"]
}));

const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const gameRooms = new Map();

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

const PORT = 3001;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Serveur backend démarré sur le port ${PORT}`);
    console.log(`🌐 Accessible localement : http://localhost:${PORT}`);
    console.log(`🌐 Accessible réseau : http://10.2.165.123:${PORT}`);
    console.log(`📱 Frontend accessible sur : http://10.2.165.123:3000`);
});

