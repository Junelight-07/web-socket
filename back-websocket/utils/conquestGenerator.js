const { v4: uuidv4 } = require('uuid');

// Types de terrains possibles
const TerrainTypes = {
    PLAIN: 'plain',
    MOUNTAIN: 'mountain',
    WATER: 'water',
};

// Niveaux de difficulté
const DifficultyLevels = {
    EASY: {
        name: 'Facile',
        enemyStartSoldiers: 20,
        enemySoldierGainMultiplier: 0.5,
        enemyTurnInterval: 2500,
        enemyAggressionThreshold: 10,
        enemyAttackPercent: { min: 20, max: 50 },
        enemyMinAttackTroops: 3,
        enemyBonusTurnChance: 0.1,
        enemyBonusTurnThreshold: 150,
        neutralCellsThreshold: 30
    },
    MEDIUM: {
        name: 'Moyen',
        enemyStartSoldiers: 35,
        enemySoldierGainMultiplier: 0.75,
        enemyTurnInterval: 2000,
        enemyAggressionThreshold: 15,
        enemyAttackPercent: { min: 30, max: 70 },
        enemyMinAttackTroops: 4,
        enemyBonusTurnChance: 0.2,
        enemyBonusTurnThreshold: 120,
        neutralCellsThreshold: 25
    },
    HARD: {
        name: 'Difficile',
        enemyStartSoldiers: 45,
        enemySoldierGainMultiplier: 1.0,
        enemyTurnInterval: 1750,
        enemyAggressionThreshold: 20,
        enemyAttackPercent: { min: 35, max: 80 },
        enemyMinAttackTroops: 5,
        enemyBonusTurnChance: 0.25,
        enemyBonusTurnThreshold: 100,
        neutralCellsThreshold: 20
    },
    IMPOSSIBLE: {
        name: 'Impossible',
        enemyStartSoldiers: 50,
        enemySoldierGainMultiplier: 1.25,
        enemyTurnInterval: 1500,
        enemyAggressionThreshold: 25,
        enemyAttackPercent: { min: 40, max: 100 },
        enemyMinAttackTroops: 5,
        enemyBonusTurnChance: 0.3,
        enemyBonusTurnThreshold: 100,
        neutralCellsThreshold: 20
    }
};

// Configuration des tailles de map
const MapConfigs = {
    SMALL: {
        name: '2 Joueurs',
        description: 'Carte petite - Combat rapide',
        rows: 15,
        cols: 15,
        enemyCount: 1
    },
    MEDIUM: {
        name: '5 Joueurs',
        description: 'Carte moyenne - Bataille équilibrée',
        rows: 25,
        cols: 25,
        enemyCount: 4
    },
    LARGE: {
        name: '10 Joueurs',
        description: 'Carte grande - Guerre épique',
        rows: 35,
        cols: 35,
        enemyCount: 9
    }
};

// Couleurs pour les différents bots ennemis
const EnemyColors = [
    { name: 'enemy1', color: '#8B4513', displayName: 'Marron' },
    { name: 'enemy2', color: '#4B0082', displayName: 'Indigo' },
    { name: 'enemy3', color: '#FF4500', displayName: 'Orange' },
    { name: 'enemy4', color: '#228B22', displayName: 'Vert' },
    { name: 'enemy5', color: '#FFD700', displayName: 'Doré' },
    { name: 'enemy6', color: '#FF1493', displayName: 'Rose' },
    { name: 'enemy7', color: '#00CED1', displayName: 'Turquoise' },
    { name: 'enemy8', color: '#9932CC', displayName: 'Violet' },
    { name: 'enemy9', color: '#DC143C', displayName: 'Crimson' }
];

// Fonction utilitaire pour vérifier les coordonnées dans la grille
function inBounds(x, y, cols, rows) {
    return x >= 0 && y >= 0 && x < cols && y < rows;
}

// Génération du terrain aléatoire
function generateTerrain(rows, cols) {
    const terrainMap = [];
    
    // Initialiser toute la carte en plaine
    for (let y = 0; y < rows; y++) {
        terrainMap[y] = [];
        for (let x = 0; x < cols; x++) {
            terrainMap[y][x] = TerrainTypes.PLAIN;
        }
    }

    // Générer un lac aléatoire contigu via un flood fill
    const lakeSize = Math.floor(Math.random() * 15) + 10; // entre 10 et 25 cases d'eau
    const startX = Math.floor(Math.random() * cols);
    const startY = Math.floor(Math.random() * rows);

    const queue = [[startX, startY]];
    const visited = new Set();

    let lakeCount = 0;
    while (queue.length > 0 && lakeCount < lakeSize) {
        const [x, y] = queue.shift();
        const key = `${x},${y}`;
        if (!inBounds(x, y, cols, rows) || visited.has(key)) continue;
        visited.add(key);

        terrainMap[y][x] = TerrainTypes.WATER;
        lakeCount++;

        const dirs = [
            [1, 0], [-1, 0], [0, 1], [0, -1]
        ];
        
        // Ajouter des directions aléatoires pour rendre le lac plus organique
        for (let i = dirs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
        }
        
        dirs.forEach(([dx, dy]) => {
            const nx = x + dx;
            const ny = y + dy;
            const nKey = `${nx},${ny}`;
            if (inBounds(nx, ny, cols, rows) && !visited.has(nKey) && Math.random() < 0.7) {
                queue.push([nx, ny]);
            }
        });
    }

    // Générer des montagnes aléatoires (proportionnel à la taille de la carte)
    const numMountains = Math.floor((rows * cols) / 20) + 10;
    for (let i = 0; i < numMountains; i++) {
        const x = Math.floor(Math.random() * cols);
        const y = Math.floor(Math.random() * rows);
        
        // Éviter de placer des montagnes sur l'eau
        if (terrainMap[y][x] !== TerrainTypes.WATER) {
            terrainMap[y][x] = TerrainTypes.MOUNTAIN;
        }
    }
    
    return terrainMap;
}

// Créer un bot ennemi
function createBot(id, colorIndex, difficulty) {
    return {
        id: `bot_${id}`,
        name: EnemyColors[colorIndex].displayName,
        color: EnemyColors[colorIndex].color,
        colorClass: EnemyColors[colorIndex].name,
        difficulty
    };
}

// Génère une partie complète de jeu de conquête
function generateConquestGame({ mapSize = 'SMALL', difficulty = 'MEDIUM', isPrivateGame = false, noBots = false } = {}) {
    console.log('⚙️ Génération du jeu de conquête:', { mapSize, difficulty, isPrivateGame, noBots });
    
    // Récupérer les configurations choisies
    const mapConfig = MapConfigs[mapSize] || MapConfigs.SMALL;
    const difficultyConfig = DifficultyLevels[difficulty] || DifficultyLevels.MEDIUM;
    
    console.log('📊 Configuration:', { 
        rows: mapConfig.rows, 
        cols: mapConfig.cols,
        difficultyName: difficultyConfig.name,
        isPrivateGame,
        noBots
    });
    
    // Créer la grille avec le terrain généré
    const terrain = generateTerrain(mapConfig.rows, mapConfig.cols);
    
    const grid = [];
    for (let y = 0; y < mapConfig.rows; y++) {
        grid[y] = [];
        for (let x = 0; x < mapConfig.cols; x++) {
            grid[y][x] = {
                x,
                y,
                terrain: terrain[y][x],
                owner: null, // Sera attribué plus tard
                troopCount: 0, // Sera attribué plus tard
                id: `cell_${x}_${y}`
            };
        }
    }
    
    // Créer les bots ennemis selon la configuration de la carte (sauf si noBots est activé)
    const bots = [];
    // Ne pas générer de bots si l'option noBots est activée
    if (!noBots) {
        for (let i = 0; i < mapConfig.enemyCount; i++) {
            bots.push(createBot(i, i, difficultyConfig));
        }
    }
    
    // Placer les bots sur la carte
    bots.forEach(bot => {
        let placed = false;
        let attempts = 0;
        
        while (!placed && attempts < 50) {
            const x = Math.floor(Math.random() * mapConfig.cols);
            const y = Math.floor(Math.random() * mapConfig.rows);
            
            if (grid[y][x].terrain === TerrainTypes.PLAIN && !grid[y][x].owner) {
                grid[y][x].owner = bot.id;
                grid[y][x].troopCount = difficultyConfig.enemyStartSoldiers;
                placed = true;
            }
            
            attempts++;
        }
    });
    
    return {
        grid,
        mapConfig,
        difficulty: difficultyConfig,
        bots,
        currentTurn: 0,
        gameStarted: true,
        gameOver: false,
        winner: null,
        isPrivateGame,
        noBots
    };
}

module.exports = {
    TerrainTypes,
    DifficultyLevels,
    MapConfigs,
    EnemyColors,
    generateConquestGame
};
