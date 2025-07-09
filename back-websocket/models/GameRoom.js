const { generatePuzzlePieces, checkPiecePosition } = require('../utils/puzzleGenerator');

class GameRoom {
    constructor(id, config) {
        this.id = id;
        this.config = config;
        this.users = [];
        this.pieces = generatePuzzlePieces(config);
        this.startTime = Date.now();
        this.completedPieces = 0;
    }

    addUser(userId, username) {
        const user = {
            id: userId,
            username,
            cursor: { x: 0, y: 0 },
            joinedAt: Date.now()
        };
        this.users.push(user);
        return user;
    }

    removeUser(userId) {
        this.users = this.users.filter(user => user.id !== userId);
        // Libérer toutes les pièces de cet utilisateur
        this.releaseAllPieces(userId);
    }

    grabPiece(pieceId, userId) {
        const piece = this.pieces.find(p => p.id === pieceId);
        if (!piece || piece.isGrabbed || piece.isPlaced) {
            return false;
        }

        piece.isGrabbed = true;
        piece.grabbedBy = userId;
        return true;
    }

    releasePiece(pieceId, userId) {
        const piece = this.pieces.find(p => p.id === pieceId);
        if (piece && piece.grabbedBy === userId) {
            piece.isGrabbed = false;
            piece.grabbedBy = null;
        }
    }

    releaseAllPieces(userId) {
        this.pieces.forEach(piece => {
            if (piece.grabbedBy === userId) {
                piece.isGrabbed = false;
                piece.grabbedBy = null;
            }
        });
    }

    movePiece(pieceId, position, rotation, userId) {
        const piece = this.pieces.find(p => p.id === pieceId);
        if (!piece || piece.grabbedBy !== userId) {
            return { success: false };
        }

        piece.position = position;
        piece.rotation = rotation;

        // Vérifier si la pièce est à la bonne position
        const isCorrectPosition = checkPiecePosition(piece, this.config.tolerance);

        if (isCorrectPosition && !piece.isPlaced) {
            piece.isPlaced = true;
            piece.isGrabbed = false;
            piece.grabbedBy = null;
            piece.position = piece.correctPosition; // Snap à la position exacte
            this.completedPieces++;
        }

        return {
            success: true,
            isPlaced: piece.isPlaced
        };
    }

    updateUserCursor(userId, cursor) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.cursor = cursor;
        }
    }

    isCompleted() {
        return this.completedPieces === this.pieces.length;
    }

    getGameState() {
        return {
            pieces: this.pieces,
            users: this.users,
            isCompleted: this.isCompleted(),
            startTime: this.startTime,
            completedPieces: this.completedPieces,
            totalPieces: this.pieces.length
        };
    }
}

module.exports = GameRoom;
