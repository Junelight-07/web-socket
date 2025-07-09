import React, { useState, useEffect } from 'react';
import GameLobby from './components/GameLobby';
import GameBoard from './components/GameBoard';
import { useSocket } from './hooks/useSocket';
import './styles/Game.css';

function App() {
    const [gameState, setGameState] = useState('lobby'); // 'lobby', 'playing', 'completed'
    const [roomId, setRoomId] = useState(null);
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');

    const socket = useSocket();

    useEffect(() => {
        if (!socket) return;

        socket.on('room-created', ({ roomId, pieces, players }) => {
            setRoomId(roomId);
            setGameState('playing');
            setError('');
        });

        socket.on('player-joined', ({ players, pieces }) => {
            setGameState('playing');
            setError('');
        });

        socket.on('room-error', ({ message }) => {
            setError(message);
        });

        socket.on('game-completed', ({ winner, stats }) => {
            setGameState('completed');
        });

        return () => {
            socket.off('room-created');
            socket.off('player-joined');
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

    // Affichage de chargement
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
