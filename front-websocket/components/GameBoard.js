import React, { useState, useEffect, useRef } from 'react';
import PuzzlePiece from './PuzzlePiece';
import UserCursors from './UserCursors';
import ChatPanel from './ChatPanel';
import PlayersList from './PlayersList';

const GameBoard = ({ gameState, currentUser, socket, roomId }) => {
    const [draggedPiece, setDraggedPiece] = useState(null);
    const [otherCursors, setOtherCursors] = useState({});
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const boardRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        socket.on('cursor-update', ({ userId, x, y, username }) => {
            setOtherCursors(prev => ({
                ...prev,
                [userId]: { x, y, username }
            }));
        });

        return () => {
            socket.off('cursor-update');
        };
    }, [socket]);

    const handleMouseMove = (e) => {
        if (!boardRef.current) return;

        const rect = boardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setMousePosition({ x, y });

        // Envoyer position du curseur (throttle pourrait être ajouté ici)
        socket.emit('cursor-move', { x, y });
    };

    const handlePieceGrab = (pieceId) => {
        const piece = gameState.pieces.find(p => p.id === pieceId);
        if (piece.isGrabbed || piece.isPlaced) return;

        socket.emit('piece-grabbed', { pieceId });
        setDraggedPiece(pieceId);
    };

    const handlePieceMove = (pieceId, position, rotation) => {
        socket.emit('move-piece', { pieceId, position, rotation });
    };

    const handlePieceRelease = (pieceId) => {
        socket.emit('piece-released', { pieceId });
        setDraggedPiece(null);
    };

    const progress = gameState.completedPieces / gameState.totalPieces * 100;

    return (
        <div className="game-container">
            <div className="game-header">
                <h2>Room: {roomId}</h2>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                    />
                    <span className="progress-text">
            {gameState.completedPieces}/{gameState.totalPieces} pièces
          </span>
                </div>
            </div>

            <div className="game-main">
                <div className="game-board-container">
                    <div
                        ref={boardRef}
                        className="game-board"
                        onMouseMove={handleMouseMove}
                    >
                        {/* Zone de puzzle cible */}
                        <div className="puzzle-target-area">
                            <div className="puzzle-background" />
                        </div>

                        {/* Pièces du puzzle */}
                        {gameState.pieces.map(piece => (
                            <PuzzlePiece
                                key={piece.id}
                                piece={piece}
                                currentUser={currentUser}
                                onGrab={handlePieceGrab}
                                onMove={handlePieceMove}
                                onRelease={handlePieceRelease}
                                isDragged={draggedPiece === piece.id}
                            />
                        ))}

                        {/* Curseurs des autres joueurs */}
                        <UserCursors
                            cursors={otherCursors}
                            currentUserId={currentUser.id}
                        />
                    </div>
                </div>

                <div className="game-sidebar">
                    <PlayersList
                        users={gameState.users}
                        currentUser={currentUser}
                    />
                    <ChatPanel
                        socket={socket}
                        currentUser={currentUser}
                    />
                </div>
            </div>
        </div>
    );
};

export default GameBoard;
