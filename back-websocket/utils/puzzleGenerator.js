const { v4: uuidv4 } = require('uuid');

function generatePuzzlePieces(config) {
    const pieces = [];
    const { rows, cols } = config.gridSize;
    const { width, height } = config.pieceSize;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const piece = {
                id: uuidv4(),
                gridPosition: { row, col },
                position: {
                    x: Math.random() * (config.boardSize.width - width),
                    y: Math.random() * (config.boardSize.height - height)
                },
                correctPosition: {
                    x: col * width + 200, // Offset pour la zone de puzzle
                    y: row * height + 100
                },
                rotation: 0,
                isGrabbed: false,
                grabbedBy: null,
                isPlaced: false,
                imageClip: {
                    x: col * width,
                    y: row * height,
                    width,
                    height
                }
            };
            pieces.push(piece);
        }
    }

    return pieces;
}

function checkPiecePosition(piece, tolerance) {
    const dx = Math.abs(piece.position.x - piece.correctPosition.x);
    const dy = Math.abs(piece.position.y - piece.correctPosition.y);
    return dx <= tolerance && dy <= tolerance;
}

module.exports = {
    generatePuzzlePieces,
    checkPiecePosition
};
