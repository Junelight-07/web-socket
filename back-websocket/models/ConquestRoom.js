const { generateConquestGame } = require('../utils/conquestGenerator');

class ConquestRoom {
    constructor(id, host, hostUsername, config = {}) {
        this.id = id;
        this.host = host; // ID du socket de l'hôte
        this.players = [{ id: host, username: hostUsername, connected: true, color: '#FF0000' }];
        this.gameStarted = false;
        this.gameMode = 'conquest'; // Mode de jeu pour différencier des salles de puzzle
        
        // Générer le jeu de conquête avec les configurations fournies
        this.conquestGame = generateConquestGame(config);
        
        // Attribuer une position de départ au joueur hôte
        this.assignPlayerStartPosition(host);
    }
    
    // Ajouter un joueur à la salle
    addPlayer(playerId, username) {
        // Vérifier si le joueur est déjà dans la salle
        const existingPlayer = this.players.find(p => p.id === playerId);
        if (existingPlayer) return false;
        
        // Ajouter le joueur
        this.players.push({ id: playerId, username, connected: true, color: this.getNextPlayerColor() });
        
        // Lui attribuer une position de départ
        this.assignPlayerStartPosition(playerId);
        
        return true;
    }
    
    // Attribuer une position de départ à un joueur
    assignPlayerStartPosition(playerId) {
        const { grid, mapConfig } = this.conquestGame;
        const player = this.players.find(p => p.id === playerId);
        if (!player) return false;
        
        // Trouver une position valide (plaine non occupée)
        let validPosition = null;
        let attempts = 0;
        const maxAttempts = 100;
        
        while (!validPosition && attempts < maxAttempts) {
            const x = Math.floor(Math.random() * mapConfig.cols);
            const y = Math.floor(Math.random() * mapConfig.rows);
            
            if (grid[y][x].terrain === 'plain' && !grid[y][x].owner) {
                validPosition = { x, y };
                // Assigner la case au joueur
                grid[y][x].owner = playerId;
                grid[y][x].troopCount = 10; // Troupes initiales sur la case de départ
            }
            
            attempts++;
        }
        
        return !!validPosition;
    }
    
    // Obtenir la prochaine couleur pour un nouveau joueur
    getNextPlayerColor() {
        const usedColors = this.players.map(p => p.color);
        const availableColors = [
            '#FF0000', // Rouge
            '#00FF00', // Vert
            '#0000FF', // Bleu
            '#FFFF00', // Jaune
            '#FF00FF', // Magenta
            '#00FFFF', // Cyan
            '#FFA500'  // Orange
        ];
        
        // Trouver la première couleur non utilisée
        const nextColor = availableColors.find(color => !usedColors.includes(color));
        return nextColor || '#' + Math.floor(Math.random()*16777215).toString(16); // Couleur aléatoire si toutes sont prises
    }
    
    // Marquer un joueur comme déconnecté
    markPlayerDisconnected(playerId) {
        const playerIndex = this.players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            this.players[playerIndex].connected = false;
            return true;
        }
        return false;
    }
    
    // Retirer un joueur
    removePlayer(playerId) {
        const playerIndex = this.players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            // Libérer les cellules du joueur
            const { grid } = this.conquestGame;
            for (let y = 0; y < grid.length; y++) {
                for (let x = 0; x < grid[y].length; x++) {
                    if (grid[y][x].owner === playerId) {
                        grid[y][x].owner = null;
                        grid[y][x].troopCount = 0;
                    }
                }
            }
            
            // Retirer le joueur de la liste
            this.players.splice(playerIndex, 1);
            
            // Si l'hôte part, assigner un nouvel hôte
            if (playerId === this.host && this.players.length > 0) {
                this.host = this.players[0].id;
            }
            
            return true;
        }
        return false;
    }
    
    // Attaquer une cellule
    attackCell(attackerId, x, y, troopCount) {
        const { grid } = this.conquestGame;
        const attacker = this.players.find(p => p.id === attackerId);
        
        // Vérifications de base
        if (!attacker) return { success: false, message: "Joueur non trouvé" };
        if (!this.isValidPosition(x, y)) return { success: false, message: "Position invalide" };
        
        const targetCell = grid[y][x];
        
        // Vérifier si c'est une attaque valide
        if (targetCell.terrain === 'water') {
            return { success: false, message: "Impossible d'attaquer l'eau" };
        }
        
        if (targetCell.owner === attackerId) {
            return { success: false, message: "Vous possédez déjà cette cellule" };
        }
        
        // Vérifier si l'attaquant a assez de troupes adjacentes
        const adjacentTroops = this.getAdjacentTroops(attackerId, x, y);
        if (adjacentTroops < troopCount) {
            return { 
                success: false, 
                message: `Pas assez de troupes adjacentes (${adjacentTroops} disponibles)`
            };
        }
        
        // Calculer la force d'attaque et de défense
        let attackStrength = troopCount;
        let defenseStrength = targetCell.troopCount;
        
        // Bonus/Malus selon le terrain
        if (targetCell.terrain === 'mountain') {
            defenseStrength *= 1.5; // Bonus défensif en montagne
        }
        
        // Résoudre le combat
        const attackSuccess = attackStrength > defenseStrength;
        
        if (attackSuccess) {
            // L'attaquant gagne
            targetCell.owner = attackerId;
            targetCell.troopCount = Math.floor(attackStrength - defenseStrength);
            
            // Retirer les troupes utilisées des cases adjacentes
            this.removeAdjacentTroops(attackerId, x, y, troopCount);
            
            return {
                success: true,
                message: `Attaque réussie! ${targetCell.troopCount} troupes restantes`,
                result: {
                    x, y,
                    newOwner: attackerId,
                    newTroopCount: targetCell.troopCount
                }
            };
        } else {
            // Le défenseur gagne
            targetCell.troopCount = Math.floor(defenseStrength - attackStrength);
            
            // Retirer les troupes utilisées des cases adjacentes
            this.removeAdjacentTroops(attackerId, x, y, troopCount);
            
            return {
                success: false,
                message: `Attaque échouée! ${targetCell.troopCount} troupes défensives restantes`,
                result: {
                    x, y,
                    newTroopCount: targetCell.troopCount
                }
            };
        }
    }
    
    // Déplacer des troupes entre cellules adjacentes
    moveTroops(playerId, fromX, fromY, toX, toY, troopCount) {
        const { grid } = this.conquestGame;
        
        // Vérifications de base
        if (!this.isValidPosition(fromX, fromY) || !this.isValidPosition(toX, toY)) {
            return { success: false, message: "Position invalide" };
        }
        
        const fromCell = grid[fromY][fromX];
        const toCell = grid[toY][toX];
        
        // Vérifier que les deux cellules appartiennent au joueur
        if (fromCell.owner !== playerId || toCell.owner !== playerId) {
            return { success: false, message: "Vous devez posséder les deux cellules" };
        }
        
        // Vérifier que les cellules sont adjacentes
        if (!this.areCellsAdjacent(fromX, fromY, toX, toY)) {
            return { success: false, message: "Les cellules doivent être adjacentes" };
        }
        
        // Vérifier qu'il y a assez de troupes à déplacer
        if (fromCell.troopCount <= troopCount) {
            return { success: false, message: "Vous devez laisser au moins une troupe" };
        }
        
        // Déplacer les troupes
        fromCell.troopCount -= troopCount;
        toCell.troopCount += troopCount;
        
        return {
            success: true,
            message: `${troopCount} troupes déplacées`,
            result: {
                from: { x: fromX, y: fromY, troopCount: fromCell.troopCount },
                to: { x: toX, y: toY, troopCount: toCell.troopCount }
            }
        };
    }
    
    // Vérifier si une position est valide
    isValidPosition(x, y) {
        const { mapConfig } = this.conquestGame;
        return x >= 0 && y >= 0 && x < mapConfig.cols && y < mapConfig.rows;
    }
    
    // Vérifier si deux cellules sont adjacentes
    areCellsAdjacent(x1, y1, x2, y2) {
        const dx = Math.abs(x1 - x2);
        const dy = Math.abs(y1 - y2);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }
    
    // Obtenir le nombre de troupes adjacentes appartenant à un joueur
    getAdjacentTroops(playerId, x, y) {
        const { grid, mapConfig } = this.conquestGame;
        let totalTroops = 0;
        
        const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // haut, droite, bas, gauche
        
        for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (this.isValidPosition(nx, ny) && grid[ny][nx].owner === playerId) {
                // Ne pas utiliser toutes les troupes, en garder au moins une
                const availableTroops = grid[ny][nx].troopCount - 1;
                if (availableTroops > 0) {
                    totalTroops += availableTroops;
                }
            }
        }
        
        return totalTroops;
    }
    
    // Retirer des troupes adjacentes pour une attaque
    removeAdjacentTroops(playerId, x, y, totalTroopsNeeded) {
        const { grid } = this.conquestGame;
        let troopsLeft = totalTroopsNeeded;
        
        const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // haut, droite, bas, gauche
        
        // Première passe: calculer les troupes disponibles par cellule
        const adjacentCells = [];
        
        for (const [dx, dy] of dirs) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (this.isValidPosition(nx, ny) && grid[ny][nx].owner === playerId) {
                const availableTroops = grid[ny][nx].troopCount - 1; // Garder au moins 1 troupe
                if (availableTroops > 0) {
                    adjacentCells.push({ x: nx, y: ny, availableTroops });
                }
            }
        }
        
        // Trier par nombre de troupes disponibles (du plus grand au plus petit)
        adjacentCells.sort((a, b) => b.availableTroops - a.availableTroops);
        
        // Prendre des troupes proportionnellement
        for (const cell of adjacentCells) {
            if (troopsLeft <= 0) break;
            
            const troopsToTake = Math.min(cell.availableTroops, Math.ceil(troopsLeft * (cell.availableTroops / adjacentCells.reduce((sum, c) => sum + c.availableTroops, 0))));
            
            grid[cell.y][cell.x].troopCount -= troopsToTake;
            troopsLeft -= troopsToTake;
        }
        
        return totalTroopsNeeded - troopsLeft;
    }
    
    // Gérer une attaque - fonction wrapper principale utilisée par le serveur
    handleAttack(attackerId, x, y, troopCount) {
        return this.attackCell(attackerId, x, y, troopCount);
    }
    
    // Fin du tour d'un joueur
    endPlayerTurn(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return false;
        
        // Donner des troupes supplémentaires au joueur en fin de tour
        this.addTroopsForPlayer(playerId);
        
        // Marquer le tour comme terminé pour ce joueur
        player.turnEnded = true;
        
        // Vérifier si tous les joueurs ont terminé leur tour
        const allTurnsEnded = this.players.every(p => p.turnEnded || !p.connected);
        
        if (allTurnsEnded) {
            // Réinitialiser les indicateurs de fin de tour
            this.players.forEach(p => {
                p.turnEnded = false;
            });
            
            // Incrémenter le compteur de tours
            this.conquestGame.currentTurn = (this.conquestGame.currentTurn || 0) + 1;
        }
        
        return true;
    }
    
    // Ajouter des troupes pour un joueur en fin de tour
    addTroopsForPlayer(playerId) {
        const { grid } = this.conquestGame;
        
        // Compter les cellules contrôlées par le joueur
        let controlledCells = 0;
        
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                if (grid[y][x].owner === playerId) {
                    controlledCells++;
                }
            }
        }
        
        // Calculer le nombre de troupes à ajouter
        // Formule: 3 + (nombre de cellules / 3), arrondi à l'entier
        const troopsToAdd = Math.max(3, Math.floor(3 + (controlledCells / 3)));
        
        // Distribuer les troupes sur les cellules contrôlées par le joueur
        if (controlledCells > 0) {
            // Recherche de la cellule avec le plus de troupes pour le joueur
            let maxTroopCell = null;
            
            for (let y = 0; y < grid.length; y++) {
                for (let x = 0; x < grid[y].length; x++) {
                    const cell = grid[y][x];
                    if (cell.owner === playerId) {
                        if (!maxTroopCell || cell.troopCount > grid[maxTroopCell.y][maxTroopCell.x].troopCount) {
                            maxTroopCell = { x, y };
                        }
                    }
                }
            }
            
            // Ajouter les troupes à la cellule avec le plus de troupes
            if (maxTroopCell) {
                grid[maxTroopCell.y][maxTroopCell.x].troopCount += troopsToAdd;
            }
        }
        
        return troopsToAdd;
    }
    
    // Traiter les tours des bots (IA)
    processBotTurns() {
        const { bots, difficulty } = this.conquestGame;
        
        // Si pas de bots, rien à faire
        if (!bots || bots.length === 0) return;
        
        for (const bot of bots) {
            this.processBotTurn(bot, difficulty);
        }
    }
    
    // Traiter le tour d'un bot (IA)
    processBotTurn(bot, difficulty) {
        const { grid, mapConfig } = this.conquestGame;
        
        // Compter les cellules du bot
        let botCells = [];
        
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                if (grid[y][x].owner === bot.id) {
                    botCells.push({ x, y, troopCount: grid[y][x].troopCount });
                }
            }
        }
        
        if (botCells.length === 0) return; // Bot éliminé
        
        // Ajouter des troupes pour le bot (similaire au joueur)
        const troopsToAdd = Math.max(3, Math.floor(3 + (botCells.length / 3)));
        const randomCellIndex = Math.floor(Math.random() * botCells.length);
        const randomCell = botCells[randomCellIndex];
        
        grid[randomCell.y][randomCell.x].troopCount += troopsToAdd;
        
        // Mise à jour des cellules du bot après ajout des troupes
        botCells = [];
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                if (grid[y][x].owner === bot.id) {
                    botCells.push({ x, y, troopCount: grid[y][x].troopCount });
                }
            }
        }
        
        // Stratégie d'attaque du bot
        // 1. Trouver les cellules adjacentes aux cellules du bot
        const attackableCells = [];
        
        for (const cell of botCells) {
            const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // haut, droite, bas, gauche
            
            for (const [dx, dy] of dirs) {
                const nx = cell.x + dx;
                const ny = cell.y + dy;
                
                if (this.isValidPosition(nx, ny) && 
                    grid[ny][nx].owner !== bot.id && 
                    grid[ny][nx].terrain !== 'water') {
                    
                    // Calculer la force relative d'attaque
                    let attackStrength = cell.troopCount - 1; // Garder une troupe
                    let defenseStrength = grid[ny][nx].troopCount;
                    
                    // Bonus défensif en montagne
                    if (grid[ny][nx].terrain === 'mountain') {
                        defenseStrength *= 1.5;
                    }
                    
                    const attackSuccessChance = attackStrength / (attackStrength + defenseStrength);
                    
                    attackableCells.push({
                        fromX: cell.x, 
                        fromY: cell.y,
                        toX: nx, 
                        toY: ny,
                        attackStrength,
                        defenseStrength,
                        successChance: attackSuccessChance,
                        isNeutral: grid[ny][nx].owner === null
                    });
                }
            }
        }
        
        // Trier par chance de succès (du plus élevé au plus bas)
        attackableCells.sort((a, b) => b.successChance - a.successChance);
        
        // Attaquer jusqu'à 3 cellules (ou moins si pas assez de cibles)
        const maxAttacks = Math.min(3, attackableCells.length);
        
        for (let i = 0; i < maxAttacks; i++) {
            const attack = attackableCells[i];
            
            // Vérifier que la cellule source a encore assez de troupes
            const updatedFromCell = grid[attack.fromY][attack.fromX];
            if (updatedFromCell.owner !== bot.id || updatedFromCell.troopCount <= 1) {
                continue;
            }
            
            const attackTroops = Math.ceil((updatedFromCell.troopCount - 1) * 0.7); // Utiliser 70% des troupes
            
            if (attackTroops <= 0) continue;
            
            // Exécuter l'attaque
            this.attackCell(bot.id, attack.toX, attack.toY, attackTroops);
        }
    }
    
    // Vérifier si un joueur a gagné
    checkVictory() {
        const { grid, mapConfig } = this.conquestGame;
        const totalCells = mapConfig.rows * mapConfig.cols;
        const cellCounts = new Map();
        let validCells = 0; // Cellules non-eau
        
        // Compter les cellules par joueur
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                const cell = grid[y][x];
                
                // Ignorer les cellules d'eau
                if (cell.terrain === 'water') continue;
                
                validCells++;
                
                if (cell.owner) {
                    cellCounts.set(cell.owner, (cellCounts.get(cell.owner) || 0) + 1);
                }
            }
        }
        
        // Vérifier si un joueur contrôle plus de 75% des cellules valides
        for (const [playerId, count] of cellCounts.entries()) {
            const controlledPercent = Math.floor((count / validCells) * 100);
            
            if (controlledPercent >= 75) {
                // Trouver le nom du joueur
                let winnerUsername = 'Un joueur';
                const player = this.players.find(p => p.id === playerId);
                
                if (player) {
                    winnerUsername = player.username;
                } else {
                    // Vérifier si c'est un bot
                    const bot = this.conquestGame.bots?.find(b => b.id === playerId);
                    if (bot) {
                        winnerUsername = `Bot ${bot.name}`;
                    }
                }
                
                return {
                    gameOver: true,
                    winnerId: playerId,
                    winnerUsername,
                    controlledPercent
                };
            }
        }
        
        return { gameOver: false };
    }
    
    // Obtenir l'état actuel du jeu
    getGameState() {
        return {
            id: this.id,
            players: this.players,
            gameStarted: this.gameStarted,
            gameMode: this.gameMode,
            conquestGame: {
                grid: this.conquestGame.grid,
                mapConfig: this.conquestGame.mapConfig,
                difficulty: this.conquestGame.difficulty,
                enemyBots: this.conquestGame.enemyBots,
                status: this.conquestGame.status,
                lastUpdate: this.conquestGame.lastUpdate
            }
        };
    }
}

module.exports = ConquestRoom;
