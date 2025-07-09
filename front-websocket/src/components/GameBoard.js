import React from 'react';

const GameBoard = ({ socket, roomId, username, players = [], pieces = [] }) => {
    return (
        <div className="game-board">
            <div className="board-header">
                <h2>🎯 Partie en cours</h2>
                <p>Room: {roomId} | Joueur: {username}</p>
            </div>

            <div className="players-section">
                <h3>👥 Joueurs connectés ({players.length}):</h3>
                <div className="players-list">
                    {players.map((player, index) => (
                        <div 
                            key={player.id} 
                            className={`player-item ${player.username === username ? 'current-player' : ''}`}
                        >
                            <span className="player-icon">🧑‍💼</span>
                            <span className="player-name">{player.username}</span>
                            {player.username === username && <span className="you-indicator">(Vous)</span>}
                            <span className={`player-status ${player.connected ? 'online' : 'offline'}`}>
                                {player.connected ? '🟢' : '🔴'}
                            </span>
                        </div>
                    ))}
                </div>
                {players.length === 0 && (
                    <p className="no-players">Aucun joueur connecté</p>
                )}
            </div>

            <div className="puzzle-container">
                <div className="puzzle-area">
                    <p>Le puzzle sera affiché ici</p>
                    <p>Websocket connecté : {socket ? '✅' : '❌'}</p>
                    <p>Pièces de puzzle : {pieces.length}</p>
                </div>
            </div>
        </div>
    );
};

export default GameBoard;
