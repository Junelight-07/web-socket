class PuzzlePiece {
    constructor(id, correctPosition, imageClip) {
        this.id = id;
        this.correctPosition = correctPosition; // Position finale correcte
        this.position = this.getRandomStartPosition(); // Position actuelle
        this.imageClip = imageClip; // Zone de l'image à afficher
        this.rotation = 0; // Rotation de la pièce
        this.isPlaced = false; // Si la pièce est à sa place finale
        this.isGrabbed = false; // Si quelqu'un manipule la pièce
        this.grabbedBy = null; // ID du joueur qui manipule
        this.grabbedAt = null; // Timestamp du grab
        this.zIndex = 1; // Ordre d'affichage
    }

    // Génère une position de départ aléatoire
    getRandomStartPosition() {
        const margin = 50;
        const boardWidth = 800;
        const boardHeight = 600;

        return {
            x: Math.random() * (boardWidth - 200) + margin,
            y: Math.random() * (boardHeight - 200) + margin
        };
    }

    // Vérifie si la pièce est proche de sa position correcte
    isInCorrectPosition(tolerance = 25) {
        const dx = Math.abs(this.position.x - this.correctPosition.x);
        const dy = Math.abs(this.position.y - this.correctPosition.y);
        return dx <= tolerance && dy <= tolerance;
    }

    // Marque la pièce comme prise par un joueur
    grab(playerId) {
        this.isGrabbed = true;
        this.grabbedBy = playerId;
        this.grabbedAt = Date.now();
        this.zIndex = 999; // Mettre au premier plan
    }

    // Libère la pièce
    release() {
        this.isGrabbed = false;
        this.grabbedBy = null;
        this.grabbedAt = null;
        this.zIndex = 1;
    }

    // Met à jour la position de la pièce
    updatePosition(newPosition) {
        this.position = { ...newPosition };

        // Vérifier si elle est maintenant à la bonne place
        if (this.isInCorrectPosition() && !this.isPlaced) {
            this.snapToCorrectPosition();
            return true; // Indique qu'elle a été placée
        }

        return false;
    }

    // Accroche la pièce à sa position correcte
    snapToCorrectPosition() {
        this.position = { ...this.correctPosition };
        this.isPlaced = true;
        this.rotation = 0;
        this.release();
    }

    // Applique une rotation à la pièce
    rotate(angle) {
        if (!this.isPlaced) {
            this.rotation = (this.rotation + angle) % 360;
        }
    }

    // Vérifie si la pièce peut être manipulée
    canBeGrabbed(playerId) {
        if (this.isPlaced) return false;
        if (!this.isGrabbed) return true;
        if (this.grabbedBy === playerId) return true;

        // Timeout après 30 secondes d'inactivité
        const timeout = 30000;
        return (Date.now() - this.grabbedAt) > timeout;
    }

    // Sérialise la pièce pour l'envoi au client
    toClient() {
        return {
            id: this.id,
            position: this.position,
            correctPosition: this.correctPosition,
            imageClip: this.imageClip,
            rotation: this.rotation,
            isPlaced: this.isPlaced,
            isGrabbed: this.isGrabbed,
            grabbedBy: this.grabbedBy,
            zIndex: this.zIndex
        };
    }
}

module.exports = PuzzlePiece;
