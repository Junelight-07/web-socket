import React, { useState, useRef } from 'react';

const PuzzlePiece = ({
                         piece,
                         currentUser,
                         onGrab,
                         onMove,
                         onRelease,
                         isDragged
                     }) => {
    const [dragStart, setDragStart] = useState(null);
    const pieceRef = useRef(null);

    const handleMouseDown = (e) => {
        if (piece.isGrabbed && piece.grabbedBy !== currentUser.id) return;
        if (piece.isPlaced) return;

        e.preventDefault();
        const rect = pieceRef.current.getBoundingClientRect();
        const offset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        setDragStart({ offset, startPos: { ...piece.position } });
        onGrab(piece.id);
    };

    const handleMouseMove = (e) => {
        if (!isDragged || !dragStart) return;

        const newPosition = {
            x: e.clientX - dragStart.offset.x,
            y: e.clientY - dragStart.offset.y
        };

        onMove(piece.id, newPosition, piece.rotation);
    };

    const handleMouseUp = () => {
        if (isDragged) {
            onRelease(piece.id);
            setDragStart(null);
        }
    };

    React.useEffect(() => {
        if (isDragged) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragged, dragStart]);

    const isGrabbedByOther = piece.isGrabbed && piece.grabbedBy !== currentUser.id;
    const grabbedByUser = piece.isGrabbed ?
        piece.grabbedBy : null;

    return (
        <div
            ref={pieceRef}
            className={`puzzle-piece ${piece.isPlaced ? 'placed' : ''} ${
                isGrabbedByOther ? 'grabbed-by-other' : ''
            } ${isDragged ? 'dragging' : ''}`}
            style={{
                left: piece.position.x,
                top: piece.position.y,
                transform: `rotate(${piece.rotation}deg)`,
                backgroundImage: 'url(/puzzle-image.jpg)',
                backgroundPosition: `-${piece.imageClip.x}px -${piece.imageClip.y}px`,
                backgroundSize: '400px 400px',
                backgroundRepeat: 'no-repeat',
                width: piece.imageClip.width,
                height: piece.imageClip.height,
                cursor: piece.isPlaced ? 'default' : 'grab',
                border: piece.isPlaced ? '2px solid #4CAF50' : '2px solid #fff',
                borderRadius: '5px',
                boxShadow: piece.isPlaced ? '0 0 10px rgba(76, 175, 80, 0.5)' : '0 2px 4px rgba(0,0,0,0.1)'
            }}

            onMouseDown={handleMouseDown}
        >
            {isGrabbedByOther && (
                <div className="grabbed-indicator">
                    Pris par {grabbedByUser}
                </div>
            )}
        </div>
    );
};

export default PuzzlePiece;
