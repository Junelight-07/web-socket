import React, { useState } from 'react';

const GameLobby = ({ onCreateRoom, onJoinRoom }) => {
    const [username, setUsername] = useState('');
    const [roomId, setRoomId] = useState('');
    const [gameMode, setGameMode] = useState('puzzle'); // 'puzzle' ou 'conquest'
    const [mapSize, setMapSize] = useState('SMALL');
    const [difficulty, setDifficulty] = useState('MEDIUM');
    const [isPrivateGame, setIsPrivateGame] = useState(false);
    
    // Options pour la création de partie
    const handleCreateRoom = () => {
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
                    <label>Votre nom:</label>
                    <input
                        type="text"
                        placeholder="Entrez votre nom"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                
                <div className="buttons">
                    <button 
                        className="create-btn"
                        onClick={handleCreateRoom}
                        disabled={!username}
                    >
                        Créer une partie
                    </button>
                    
                    {gameMode === 'conquest' && (
                        <div className="private-game-container">
                            <button 
                                className="create-private-btn"
                                onClick={handleCreatePrivateGame}
                                disabled={!username}
                                title="Partie multijoueur sans bots sur une grande carte"
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
                    <div className="join-inputs">
                        <input
                            type="text"
                            placeholder="Code de la partie"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                        />
                        <button 
                            onClick={() => onJoinRoom(roomId, username)}
                            disabled={!username || !roomId}
                        >
                            Rejoindre
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameLobby;
