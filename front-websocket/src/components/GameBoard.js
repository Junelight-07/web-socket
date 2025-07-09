import React, { useState, useEffect } from 'react';
import GameRules from './GameRules';

const GameBoard = ({ socket, roomId, username, players = [], pieces = [] }) => {
    const [draggedPiece, setDraggedPiece] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [localPieces, setLocalPieces] = useState([]);

    // Synchroniser les pièces reçues du serveur
    useEffect(() => {
        setLocalPieces(pieces);
    }, [pieces]);

    // Gestion des événements Socket.IO pour les pièces
    useEffect(() => {
        if (!socket) return;

        const handlePieceUpdate = ({ pieces: updatedPieces }) => {
            console.log('🔄 Pièces mises à jour:', updatedPieces.length);
            setLocalPieces(updatedPieces);
        };

        const handlePieceGrabbed = ({ pieceId, playerId, playerName }) => {
            console.log(`🤏 Pièce ${pieceId} saisie par ${playerName}`);
            setLocalPieces(prev => prev.map(piece => 
                piece.id === pieceId 
                    ? { ...piece, isGrabbed: true, grabbedBy: playerId }
                    : piece
            ));
        };

        const handlePieceReleased = ({ pieceId }) => {
            console.log(`🤲 Pièce ${pieceId} relâchée`);
            setLocalPieces(prev => prev.map(piece => 
                piece.id === pieceId 
                    ? { ...piece, isGrabbed: false, grabbedBy: null }
                    : piece
            ));
        };

        socket.on('pieces-updated', handlePieceUpdate);
        socket.on('piece-grabbed', handlePieceGrabbed);
        socket.on('piece-released', handlePieceReleased);

        return () => {
            socket.off('pieces-updated', handlePieceUpdate);
            socket.off('piece-grabbed', handlePieceGrabbed);
            socket.off('piece-released', handlePieceReleased);
        };
    }, [socket]);

    const handleMouseDown = (e, piece) => {
        if (piece.isGrabbed && piece.grabbedBy !== socket.id) return;
        if (piece.isPlaced) return;

        e.preventDefault();
        const rect = e.target.getBoundingClientRect();
        const puzzleBoard = e.target.closest('.puzzle-board');
        const boardRect = puzzleBoard.getBoundingClientRect();
        
        const offset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        setDraggedPiece(piece.id);
        setDragOffset(offset);
        
        // Informer le serveur que la pièce est saisie
        socket.emit('grab-piece', { 
            roomId, 
            pieceId: piece.id, 
            playerId: socket.id,
            playerName: username
        });

        // Ajouter les event listeners pour le drag
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        if (!draggedPiece) return;

        const puzzleBoard = document.querySelector('.puzzle-board');
        if (!puzzleBoard) return;

        const boardRect = puzzleBoard.getBoundingClientRect();
        
        const newX = e.clientX - boardRect.left - dragOffset.x;
        const newY = e.clientY - boardRect.top - dragOffset.y;

        // Limiter les pièces dans les limites du plateau
        const constrainedX = Math.max(0, Math.min(newX, 800 - 100));
        const constrainedY = Math.max(0, Math.min(newY, 600 - 100));

        // Mettre à jour la position localement (pour un déplacement fluide)
        setLocalPieces(prev => prev.map(piece => 
            piece.id === draggedPiece 
                ? { ...piece, position: { x: constrainedX, y: constrainedY } }
                : piece
        ));

        // Envoyer la position au serveur (avec throttling)
        if (Date.now() - (handleMouseMove.lastSent || 0) > 50) {
            socket.emit('move-piece', { 
                roomId, 
                pieceId: draggedPiece, 
                position: { x: constrainedX, y: constrainedY }
            });
            handleMouseMove.lastSent = Date.now();
        }
    };

    const handleMouseUp = () => {
        if (!draggedPiece) return;

        // Relâcher la pièce
        socket.emit('release-piece', { 
            roomId, 
            pieceId: draggedPiece 
        });

        setDraggedPiece(null);
        setDragOffset({ x: 0, y: 0 });

        // Retirer les event listeners
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const handlePieceGrab = (pieceId) => {
        console.log('🎯 Pièce saisie:', pieceId);
        setDraggedPiece(pieceId);
        socket.emit('grab-piece', { roomId, pieceId, playerId: socket.id });
    };

    return (
        <div className="game-board">
            <div className="board-header">
                <h2>🎯 Partie en cours</h2>
                <p>Room: {roomId} | Joueur: {username}</p>
                <GameRules />
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
                    <h3>🧩 Puzzle ({localPieces.length} pièces)</h3>
                    
                    {localPieces.length > 0 ? (
                        <div className="puzzle-board" style={{ 
                            position: 'relative', 
                            width: '800px', 
                            height: '600px', 
                            background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                            backgroundSize: '20px 20px',
                            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                            border: '3px solid #333',
                            borderRadius: '10px',
                            margin: '0 auto',
                            userSelect: 'none'
                        }}>
                            {/* Zone de placement correcte */}
                            <div className="correct-zone" style={{
                                position: 'absolute',
                                left: '200px',
                                top: '100px',
                                width: '300px',
                                height: '300px',
                                border: '2px dashed #4CAF50',
                                borderRadius: '8px',
                                background: 'rgba(76, 175, 80, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#4CAF50',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}>
                                Zone de placement
                            </div>

                            {localPieces.map((piece) => {
                                const isCurrentPlayerDragging = draggedPiece === piece.id;
                                const isOtherPlayerHolding = piece.isGrabbed && piece.grabbedBy !== socket.id;
                                
                                return (
                                    <div
                                        key={piece.id}
                                        className={`puzzle-piece 
                                            ${piece.isGrabbed ? 'grabbed' : ''} 
                                            ${piece.isPlaced ? 'placed' : ''}
                                            ${isCurrentPlayerDragging ? 'dragging' : ''}
                                            ${isOtherPlayerHolding ? 'held-by-other' : ''}
                                        `}
                                        style={{
                                            position: 'absolute',
                                            left: `${piece.position.x}px`,
                                            top: `${piece.position.y}px`,
                                            width: `${piece.imageClip.width}px`,
                                            height: `${piece.imageClip.height}px`,
                                            background: `hsl(${piece.gridPosition.row * 40 + piece.gridPosition.col * 60}, 70%, 60%)`,
                                            border: piece.isPlaced ? '3px solid #4CAF50' : '2px solid #333',
                                            cursor: isOtherPlayerHolding ? 'not-allowed' : 
                                                   piece.isPlaced ? 'default' : 'grab',
                                            zIndex: isCurrentPlayerDragging ? 1000 : 
                                                   piece.isGrabbed ? 100 : 1,
                                            opacity: isOtherPlayerHolding ? 0.6 : 1,
                                            transform: isCurrentPlayerDragging ? 'scale(1.1)' : 'scale(1)',
                                            transition: isCurrentPlayerDragging ? 'none' : 'all 0.2s ease',
                                            borderRadius: '8px',
                                            boxShadow: isCurrentPlayerDragging ? '0 8px 25px rgba(0,0,0,0.3)' : 
                                                      piece.isGrabbed ? '0 4px 15px rgba(0,0,0,0.2)' : 'none'
                                        }}
                                        onMouseDown={(e) => handleMouseDown(e, piece)}
                                    >
                                        <div className="piece-info" style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            height: '100%',
                                            color: 'white',
                                            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}>
                                            <div>{piece.gridPosition.row}-{piece.gridPosition.col}</div>
                                            {piece.isPlaced && <div style={{fontSize: '16px'}}>✅</div>}
                                        </div>
                                        
                                        {piece.isGrabbed && (
                                            <div className="grabbed-indicator" style={{
                                                position: 'absolute',
                                                top: '-30px',
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                background: 'rgba(0, 0, 0, 0.8)',
                                                color: 'white',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '10px',
                                                whiteSpace: 'nowrap',
                                                zIndex: 1001
                                            }}>
                                                {piece.grabbedBy === socket.id ? '🤏 Vous' : `🤏 ${piece.grabbedBy}`}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
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
