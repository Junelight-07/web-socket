import React, { useState } from 'react';

const GameBoard = ({ socket, roomId, username, players = [], pieces = [] }) => {
    const [draggedPiece, setDraggedPiece] = useState(null);

    const handlePieceGrab = (pieceId) => {
        console.log('🎯 Pièce saisie:', pieceId);
        setDraggedPiece(pieceId);
        socket.emit('grab-piece', { roomId, pieceId, playerId: socket.id });
    };

    const handlePieceMove = (pieceId, position) => {
        console.log('📱 Pièce déplacée:', pieceId, position);
        socket.emit('move-piece', { roomId, pieceId, position });
    };

    const handlePieceRelease = (pieceId) => {
        console.log('🤲 Pièce relâchée:', pieceId);
        setDraggedPiece(null);
        socket.emit('release-piece', { roomId, pieceId });
    };

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
                    <h3>🧩 Puzzle ({pieces.length} pièces)</h3>
                    
                    {pieces.length > 0 ? (
                        <div className="puzzle-board" style={{ 
                            position: 'relative', 
                            width: '800px', 
                            height: '600px', 
                            background: '#f0f0f0',
                            border: '2px solid #ccc',
                            margin: '0 auto'
                        }}>
                            {pieces.map((piece) => (
                                <div
                                    key={piece.id}
                                    className={`puzzle-piece ${piece.isGrabbed ? 'grabbed' : ''} ${piece.isPlaced ? 'placed' : ''}`}
                                    style={{
                                        position: 'absolute',
                                        left: `${piece.position.x}px`,
                                        top: `${piece.position.y}px`,
                                        width: `${piece.imageClip.width}px`,
                                        height: `${piece.imageClip.height}px`,
                                        background: `hsl(${piece.gridPosition.row * 40 + piece.gridPosition.col * 60}, 70%, 60%)`,
                                        border: '2px solid #333',
                                        cursor: piece.isGrabbed && piece.grabbedBy !== socket.id ? 'not-allowed' : 'grab',
                                        zIndex: draggedPiece === piece.id ? 1000 : 1,
                                        opacity: piece.isGrabbed && piece.grabbedBy !== socket.id ? 0.5 : 1
                                    }}
                                    onMouseDown={() => handlePieceGrab(piece.id)}
                                >
                                    <div className="piece-info">
                                        {piece.gridPosition.row}-{piece.gridPosition.col}
                                    </div>
                                    {piece.isGrabbed && (
                                        <div className="grabbed-indicator">
                                            {piece.grabbedBy === socket.id ? '🤏 Vous' : '🤏 Pris'}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-puzzle">
                            <p>⏳ Chargement du puzzle...</p>
                            <p>Websocket connecté : {socket ? '✅' : '❌'}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GameBoard;
