const PuzzlePiece = require('../models/PuzzlePiece');

// Génère les pièces du puzzle
function generatePuzzlePieces(rows = 3, cols = 3, imageSize = 400) {
    const pieces = [];
    const pieceWidth = imageSize / cols;
    const pieceHeight = imageSize / rows;

    let pieceId = 0;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const correctPosition = {
                x: 200 + (col * pieceWidth), // Position dans la zone target
                y: 100 + (row * pieceHeight)
            };

            const imageClip = {
                x: col * pieceWidth,
                y: row * pieceHeight,
                width: pieceWidth,
                height: pieceHeight
            };

            const piece = new PuzzlePiece(pieceId++, correctPosition, imageClip);
            pieces.push(piece);
        }
    }

    return pieces;
}

// Mélange les pièces au début du jeu
function shufflePieces(pieces) {
    const shuffled = [...pieces];

    shuffled.forEach(piece => {
        piece.position = piece.getRandomStartPosition();
        piece.rotation = Math.random() > 0.7 ? (Math.floor(Math.random() * 4) * 90) : 0;
        piece.isPlaced = false;
        piece.release();
    });

    return shuffled;
}

// Vérifie si le puzzle est terminé
function isPuzzleComplete(pieces) {
    return pieces.every(piece => piece.isPlaced);
}

// Calcule le pourcentage de completion
function calculateProgress(pieces) {
    const placedPieces = pieces.filter(piece => piece.isPlaced).length;
    return Math.round((placedPieces / pieces.length) * 100);
}

// Trouve la pièce la plus proche d'une position
function findNearestPiece(pieces, position, maxDistance = 50) {
    let nearestPiece = null;
    let minDistance = maxDistance;

    pieces.forEach(piece => {
        if (piece.isPlaced) return;

        const distance = Math.sqrt(
            Math.pow(piece.position.x - position.x, 2) +
            Math.pow(piece.position.y - position.y, 2)
        );

        if (distance < minDistance) {
            minDistance = distance;
            nearestPiece = piece;
        }
    });

    return nearestPiece;
}

// Gère les collisions entre pièces
function handleCollisions(pieces, movedPiece) {
    const collisions = [];

    pieces.forEach(piece => {
        if (piece.id === movedPiece.id || piece.isPlaced) return;

        const dx = Math.abs(piece.position.x - movedPiece.position.x);
        const dy = Math.abs(piece.position.y - movedPiece.position.y);

        // Si les pièces se chevauchent
        if (dx < piece.imageClip.width/2 && dy < piece.imageClip.height/2) {
            // Pousser la pièce
            const pushDistance = 20;
            const angle = Math.atan2(
                piece.position.y - movedPiece.position.y,
                piece.position.x - movedPiece.position.x
            );

            piece.position.x += Math.cos(angle) * pushDistance;
            piece.position.y += Math.sin(angle) * pushDistance;

            // Garder dans les limites
            piece.position.x = Math.max(0, Math.min(800, piece.position.x));
            piece.position.y = Math.max(0, Math.min(600, piece.position.y));

            collisions.push(piece);
        }
    });

    return collisions;
}

// Nettoie les pièces abandonnées (timeout)
function cleanupAbandonedPieces(pieces) {
    const timeout = 30000; // 30 secondes
    const now = Date.now();
    const releasedPieces = [];

    pieces.forEach(piece => {
        if (piece.isGrabbed && (now - piece.grabbedAt) > timeout) {
            piece.release();
            releasedPieces.push(piece);
        }
    });

    return releasedPieces;
}

// Génère les statistiques du jeu
function generateGameStats(gameRoom) {
    const stats = {
        totalPieces: gameRoom.pieces.length,
        placedPieces: gameRoom.pieces.filter(p => p.isPlaced).length,
        progress: calculateProgress(gameRoom.pieces),
        playersCount: gameRoom.players.length,
        duration: Date.now() - gameRoom.createdAt,
        isComplete: isPuzzleComplete(gameRoom.pieces)
    };

    return stats;
}

// Valide une action de joueur
function validatePlayerAction(gameRoom, playerId, action) {
    const player = gameRoom.players.find(p => p.id === playerId);
    if (!player) return { valid: false, reason: 'Joueur non trouvé' };

    if (gameRoom.status === 'completed') {
        return { valid: false, reason: 'Jeu terminé' };
    }

    if (action.type === 'grab_piece') {
        const piece = gameRoom.pieces.find(p => p.id === action.pieceId);
        if (!piece) return { valid: false, reason: 'Pièce non trouvée' };

        if (!piece.canBeGrabbed(playerId)) {
            return { valid: false, reason: 'Pièce non disponible' };
        }
    }

    return { valid: true };
}

module.exports = {
    generatePuzzlePieces,
    shufflePieces,
    isPuzzleComplete,
    calculateProgress,
    findNearestPiece,
    handleCollisions,
    cleanupAbandonedPieces,
    generateGameStats,
    validatePlayerAction
};
