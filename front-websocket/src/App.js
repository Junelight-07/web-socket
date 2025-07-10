import React, { useState, useEffect } from 'react';
import GameLobby from './components/GameLobby';
import GameBoard from './components/GameBoard';
import ConquestBoard from './components/ConquestBoard';
import { useSocket } from './hooks/useSocket';
import './styles/Game.css';
import './styles/Conquest.css';

function App() {
    const [gameState, setGameState] = useState('lobby');
    const [roomId, setRoomId] = useState(null);
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [players, setPlayers] = useState([]);
    const [pieces, setPieces] = useState([]);
    const [gameMode, setGameMode] = useState('puzzle'); // 'puzzle' ou 'conquest'
    const [conquestGameState, setConquestGameState] = useState(null);

    const socket = useSocket();
    
    // Fonction pour adapter la structure des données de conquête
    const adaptConquestGameData = (data) => {
        console.log('🛠️ Adaptation des données de conquête:', { 
            hasData: !!data,
            originalKeys: data ? Object.keys(data) : [] 
        });
        
        if (!data) return null;
        
        // Si les données sont déjà dans le bon format
        if (data.conquestGame && data.conquestGame.grid) {
            return data;
        }
        
        // Si grid est directement dans l'objet principal
        if (data.grid) {
            return {
                conquestGame: { ...data }
            };
        }
        
        console.error('❌ Format de données de conquête non reconnu');
        return null;
    };

    useEffect(() => {
        if (!socket) return;

        socket.on('room-created', ({ roomId, pieces, players, gameMode, conquestGame }) => {
            console.log('🎮 Room created:', { roomId, players, gameMode });
            console.log('🔄 Données de conquête reçues:', {
                hasConquestGame: !!conquestGame,
                hasGrid: !!(conquestGame && conquestGame.grid),
                gridSize: conquestGame && conquestGame.grid ? `${conquestGame.grid.length}x${conquestGame.grid[0].length}` : 'N/A',
                mapConfig: conquestGame ? conquestGame.mapConfig : null,
                difficulty: conquestGame && conquestGame.difficulty ? conquestGame.difficulty.name : 'N/A'
            });
            
            setRoomId(roomId);
            setPlayers(players || []);
            
            // Déterminer le mode de jeu
            if (gameMode === 'conquest') {
                setGameMode('conquest');
                
                // Adaptation des données
                if (conquestGame) {
                    console.log('🔍 Structure des données de conquête:', {
                        keys: Object.keys(conquestGame)
                    });
                    
                    if (conquestGame.grid && !conquestGame.conquestGame) {
                        // Format direct: la grille est dans l'objet principal
                        console.log('⚡ Adaptation du format: grid en conquestGame.grid');
                        setConquestGameState({ conquestGame });
                    } else {
                        // Format déjà imbriqué ou autre format
                        setConquestGameState(conquestGame);
                    }
                }
            } else {
                setGameMode('puzzle');
                setPieces(pieces || []);
            }
            
            setGameState('playing');
            setError('');
        });

        socket.on('player-joined', ({ roomId, players, pieces, gameMode, conquestGame }) => {
            console.log('👥 Player joined:', { roomId, players, gameMode });
            if (roomId) setRoomId(roomId); // Mettre à jour le roomId
            setPlayers(players || []);
            
            // Déterminer le mode de jeu
            if (gameMode === 'conquest') {
                setGameMode('conquest');
                
                // Log détaillé des données reçues
                console.log('🎲 Données de conquête (player-joined):', {
                    hasConquestGame: !!conquestGame,
                    keys: conquestGame ? Object.keys(conquestGame) : []
                });
                
                // Adaptation des données
                if (conquestGame) {
                    if (conquestGame.grid && !conquestGame.conquestGame) {
                        // Format direct
                        setConquestGameState({ conquestGame });
                    } else {
                        // Format déjà imbriqué
                        setConquestGameState(conquestGame);
                    }
                }
            } else {
                setGameMode('puzzle');
                setPieces(pieces || []);
            }
            
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

        // Événements spécifiques au jeu de conquête
        socket.on('conquest-update', (gameState) => {
            console.log('🏰 Conquest update:', {
                hasData: !!gameState,
                keys: gameState ? Object.keys(gameState) : []
            });
            
            // Adaptation des données
            if (gameState) {
                if (gameState.grid && !gameState.conquestGame) {
                    // Format direct: la grille est dans l'objet principal
                    console.log('⚡ Adaptation du format dans conquest-update');
                    setConquestGameState({ conquestGame: gameState });
                } else {
                    // Format déjà imbriqué ou autre format
                    setConquestGameState(gameState);
                }
            }
        });

        socket.on('conquest-victory', ({ winner, controlledPercent }) => {
            console.log('🏆 Conquest victory:', { winner, controlledPercent });
            setGameState('completed');
        });

        return () => {
            socket.off('room-created');
            socket.off('player-joined');
            socket.off('player-left');
            socket.off('room-error');
            socket.off('game-completed');
            socket.off('conquest-update');
            socket.off('conquest-victory');
        };
    }, [socket]);

    const handleCreateRoom = (username, options = {}) => {
        if (socket && username.trim()) {
            setUsername(username.trim());
            
            // Options peut contenir gameMode, mapSize, difficulty, isPrivateGame, noBots
            socket.emit('create-room', { 
                username: username.trim(),
                gameMode: options.gameMode || 'puzzle',
                mapSize: options.mapSize || 'SMALL',
                difficulty: options.difficulty || 'MEDIUM',
                isPrivateGame: options.isPrivateGame || false,
                noBots: options.noBots || false
            });
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

                {gameState === 'playing' && socket && gameMode === 'puzzle' && (
                    <GameBoard
                        socket={socket}
                        roomId={roomId}
                        username={username}
                        players={players}
                        pieces={pieces}
                    />
                )}
                
                {gameState === 'playing' && socket && gameMode === 'conquest' && (
                    <>
                        <div style={{marginBottom: '10px', color: '#FFD700'}}>
                            Mode conquête actif: {conquestGameState ? 'Données chargées' : 'En attente des données...'}
                        </div>
                        <ConquestBoard
                            socket={socket}
                            roomId={roomId}
                            username={username}
                            players={players}
                            gameState={conquestGameState}
                        />
                    </>
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
