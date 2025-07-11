import React, { useState } from 'react';

const GameLobby = ({ onCreateRoom, onJoinRoom, error }) => {
    const [username, setUsername] = useState('');
    const [roomId, setRoomId] = useState('');
    const [gameMode, setGameMode] = useState('puzzle'); // 'puzzle' ou 'conquest'
    const [mapSize, setMapSize] = useState('SMALL');
    const [difficulty, setDifficulty] = useState('MEDIUM');
    const [isPrivateGame, setIsPrivateGame] = useState(false);
    const [attemptedCreate, setAttemptedCreate] = useState(false);
    const [attemptedJoin, setAttemptedJoin] = useState(false);
    
    // Options pour la création de partie
    const handleCreateRoom = () => {
        setAttemptedCreate(true);
        const options = {
            gameMode,
            mapSize,
            difficulty,
            isPrivateGame
        };
        onCreateRoom(username, options);
    };
    
    // Options pour la création de partie privée sans bots
    const handleCreatePrivateGame = () => {
        setAttemptedCreate(true);
        const options = {
            gameMode: 'conquest',
            mapSize: 'LARGE',
            difficulty: 'MEDIUM',
            isPrivateGame: true,
            noBots: true
        };
        onCreateRoom(username, options);
    };

    return (
        <div className="game-lobby">
            <h2>🎮 Lobby du Jeu</h2>
            
            {error && (
                <div className="lobby-error-message">
                    ⚠️ {error}
                </div>
            )}
            
            <div className="game-modes">
                <h3>Choisissez un mode de jeu</h3>
                <div className="mode-selection">
                    <div 
                        className={`game-mode ${gameMode === 'puzzle' ? 'selected' : ''}`}
                        onClick={() => setGameMode('puzzle')}
                    >
                        <div className="mode-icon">🧩</div>
                        <div className="mode-title">Puzzle Collaboratif</div>
                        <div className="mode-description">Reconstituez un puzzle en équipe</div>
                    </div>
                    
                    <div 
                        className={`game-mode ${gameMode === 'conquest' ? 'selected' : ''}`}
                        onClick={() => setGameMode('conquest')}
                    >
                        <div className="mode-icon">🏰</div>
                        <div className="mode-title">Guerre de Conquête</div>
                        <div className="mode-description">Conquérez le territoire en affrontant d'autres joueurs</div>
                    </div>
                </div>
                
                {gameMode === 'conquest' && (
                    <div className="conquest-options">
                        <div className="option-group">
                            <label>Taille de la carte:</label>
                            <select value={mapSize} onChange={(e) => setMapSize(e.target.value)}>
                                <option value="SMALL">Petite (2 joueurs)</option>
                                <option value="MEDIUM">Moyenne (5 joueurs)</option>
                                <option value="LARGE">Grande (10 joueurs)</option>
                            </select>
                        </div>
                        
                        <div className="option-group">
                            <label>Difficulté:</label>
                            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                                <option value="EASY">Facile</option>
                                <option value="MEDIUM">Moyen</option>
                                <option value="HARD">Difficile</option>
                                <option value="IMPOSSIBLE">Impossible</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="lobby-inputs">
                <div className="input-group">
                    <label>Votre nom: <span className="required-field">*</span></label>
                    <div className="input-with-validation">
                        <input
                            type="text"
                            placeholder="Entrez votre nom"
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                if (e.target.value.trim()) {
                                    setAttemptedCreate(false);
                                    setAttemptedJoin(false);
                                }
                            }}
                            className={!username.trim() && attemptedCreate ? "empty-field" : ""}
                        />
                        {!username.trim() && attemptedCreate && 
                            <div className="input-error-hint">Nom requis pour jouer</div>
                        }
                    </div>
                </div>
                
                <div className="buttons">
                    <button 
                        className={`create-btn ${!username.trim() && attemptedCreate ? 'disabled-button' : ''}`}
                        onClick={handleCreateRoom}
                        disabled={!username.trim() && attemptedCreate}
                        title={!username.trim() ? "Veuillez entrer un nom d'utilisateur" : "Créer une nouvelle partie"}
                    >
                        Créer une partie
                    </button>
                    
                    {gameMode === 'conquest' && (
                        <div className="private-game-container">
                            <button 
                                className={`create-private-btn ${!username.trim() && attemptedCreate ? 'disabled-button' : ''}`}
                                onClick={handleCreatePrivateGame}
                                disabled={!username.trim() && attemptedCreate}
                                title={!username.trim() ? "Veuillez entrer un nom d'utilisateur" : "Partie multijoueur sans bots sur une grande carte"}
                            >
                                Créer une partie privée (10 joueurs)
                            </button>
                            <div className="private-game-info">
                                🔒 Sans bots, grand plateau, pour jouer entre collègues
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="separator">ou</div>
                
                <div className="input-group">
                    <label>Rejoindre une partie existante:</label>
                    <div className="join-inputs-container">
                        <div className="join-inputs">
                            <div className="input-with-validation">
                                <input
                                    type="text"
                                    placeholder="Code de la partie"
                                    value={roomId}
                                    onChange={(e) => {
                                        setRoomId(e.target.value);
                                        if (e.target.value.trim()) {
                                            setAttemptedJoin(false);
                                        }
                                    }}
                                    className={!roomId.trim() && attemptedJoin ? "empty-field" : ""}
                                />
                                {!roomId.trim() && attemptedJoin && 
                                    <div className="input-error-hint">Code requis</div>
                                }
                            </div>
                            <button 
                                onClick={() => {
                                    setAttemptedJoin(true);
                                    onJoinRoom(roomId, username);
                                }}
                                disabled={!username || !roomId}
                                className={(!username || !roomId) ? "disabled-button" : ""}
                            >
                                Rejoindre
                            </button>
                        </div>
                        {!username.trim() && attemptedJoin && 
                            <div className="input-error-hint centered-hint">Nom d'utilisateur requis</div>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameLobby;
