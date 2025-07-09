import React, { useState, useEffect } from 'react';
import GameLobby from './components/GameLobby';
import GameBoard from './components/GameBoard';
import { useSocket } from './hooks/useSocket';
import './styles/Game.css';

function App() {
    const [gameState, setGameState] = useState('lobby');
    const [roomId, setRoomId] = useState(null);
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [players, setPlayers] = useState([]);
    const [pieces, setPieces] = useState([]);

    const socket = useSocket();

    useEffect(() => {
        if (!socket) return;

        socket.on('room-created', ({ roomId, pieces, players }) => {
            console.log('🎮 Room created:', { roomId, players });
            setRoomId(roomId);
            setPlayers(players || []);
            setPieces(pieces || []);
            setGameState('playing');
            setError('');
        });

        socket.on('player-joined', ({ roomId, players, pieces }) => {
            console.log('👥 Player joined:', { roomId, players });
            if (roomId) setRoomId(roomId); // Mettre à jour le roomId
            setPlayers(players || []);
            setPieces(pieces || []);
            setGameState('playing');
            setError('');
        });

        socket.on('player-left', ({ players }) => {
            console.log('👋 Player left:', { players });
            setPlayers(players || []);
        });

        socket.on('room-error', ({ message }) => {
            setError(message);
        });

        socket.on('puzzle-completed', ({ completedBy, completionTime }) => {
            console.log('🎉 Puzzle terminé !', { completedBy });
            setGameState('completed');
            // Vous pouvez ajouter d'autres actions ici (sons, animations, etc.)
        });

        socket.on('game-completed', ({ winner, stats }) => {
            setGameState('completed');
        });

        return () => {
            socket.off('room-created');
            socket.off('player-joined');
            socket.off('player-left');
            socket.off('room-error');
            socket.off('game-completed');
        };
    }, [socket]);

    const handleCreateRoom = (username) => {
        if (socket && username.trim()) {
            setUsername(username.trim());
            socket.emit('create-room', { username: username.trim() });
        }
    };

    const handleJoinRoom = (roomId, username) => {
        if (socket && roomId.trim() && username.trim()) {
            setUsername(username.trim());
            socket.emit('join-room', { roomId: roomId.trim(), username: username.trim() });
        }
    };

    const handleLeaveRoom = () => {
        if (socket && roomId) {
            socket.emit('leave-room', { roomId });
        }
        setGameState('lobby');
        setRoomId(null);
        setUsername('');
        setError('');
    };

    if (!socket) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Connexion au serveur...</p>
            </div>
        );
    }

    return (
        <div className="App">
            <header className="app-header">
                <h1>🧩 Puzzle Multijoueur</h1>
                {roomId && <p>Room: {roomId}</p>}
                {username && <p>Joueur: {username}</p>}
            </header>

            <main className="app-main">
                {error && (
                    <div className="error-message">
                        ❌ {error}
                    </div>
                )}

                {gameState === 'lobby' && (
                    <GameLobby
                        onCreateRoom={handleCreateRoom}
                        onJoinRoom={handleJoinRoom}
                    />
                )}

                {gameState === 'playing' && socket && (
                    <GameBoard
                        socket={socket}
                        roomId={roomId}
                        username={username}
                        players={players}
                        pieces={pieces}
                    />
                )}

                {gameState === 'completed' && (
                    <div className="game-completed">
                        <h2>🎉 Puzzle Terminé !</h2>
                        <button onClick={handleLeaveRoom} className="play-again-btn">
                            Jouer à nouveau
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
