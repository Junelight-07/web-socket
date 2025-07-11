import React, { useState, useEffect, useRef } from 'react';
import '../styles/Conquest.css';
import ConquestRules from './ConquestRules';

const ConquestBoard = ({ socket, roomId, username, players = [], gameState = null }) => {
    const [selectedCell, setSelectedCell] = useState(null);
    const [attackingSoldiers, setAttackingSoldiers] = useState(0);
    const [attackPercent, setAttackPercent] = useState(50);
    const [message, setMessage] = useState('');
    const [localGameState, setLocalGameState] = useState(null);
    const gridRef = useRef(null);
    
    // Fonction pour adapter la structure des données de conquête
    const adaptGameStateData = (data) => {
        if (!data) return null;
        
        console.log('🛠️ ConquestBoard - Adaptation des données:', { 
            hasData: !!data,
            keys: data ? Object.keys(data) : [] 
        });
        
        // Si les données sont dans un format attendu, les retourner telles quelles
        if (data.conquestGame && data.conquestGame.grid) {
            return data;
        }
        
        // Si la grille est directement dans l'objet principal
        if (data.grid) {
            return { conquestGame: data };
        }
        
        console.error('❌ ConquestBoard - Format de données non reconnu');
        return null;
    };
    
    // Synchroniser l'état du jeu
    useEffect(() => {
        console.log('🎲 ConquestBoard - État du jeu reçu:', {
            hasGameState: !!gameState,
            gameStateType: gameState ? typeof gameState : 'undefined',
            gameStateStructure: gameState ? Object.keys(gameState) : []
        });
        
        if (gameState) {
            const adaptedState = adaptGameStateData(gameState);
            console.log('✅ ConquestBoard - État adapté:', {
                hasAdaptedState: !!adaptedState,
                adaptedKeys: adaptedState ? Object.keys(adaptedState) : []
            });
            setLocalGameState(adaptedState);
        }
    }, [gameState]);
    
    // Écouter les mises à jour du jeu
    useEffect(() => {
        if (!socket) return;
        
        const handleGameUpdate = (updatedState) => {
            setLocalGameState(updatedState);
        };
        
        const handleAttackResult = (result) => {
            if (result.success) {
                setMessage(`✅ Attaque réussie: ${result.message}`);
            } else {
                setMessage(`❌ Attaque échouée: ${result.message}`);
            }
            
            setTimeout(() => setMessage(''), 3000);
        };
        
        const handleVictory = (data) => {
            setMessage(`🏆 ${data.winner} a gagné avec ${data.controlledPercent}% de contrôle!`);
        };
        
        socket.on('conquest-update', handleGameUpdate);
        socket.on('conquest-attack-result', handleAttackResult);
        socket.on('conquest-victory', handleVictory);
        
        return () => {
            socket.off('conquest-update', handleGameUpdate);
            socket.off('conquest-attack-result', handleAttackResult);
            socket.off('conquest-victory', handleVictory);
        };
    }, [socket]);
    
    // Vérifier si deux cellules sont adjacentes
    const areCellsAdjacent = (x1, y1, x2, y2) => {
        const dx = Math.abs(x1 - x2);
        const dy = Math.abs(y1 - y2);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    };
    
    // Trouver une cellule adjacente appartenant au joueur qui peut servir de source d'attaque
    const findAdjacentPlayerCell = (x, y, grid, playerId) => {
        const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // haut, droite, bas, gauche
        let bestCell = null;
        let maxTroops = 0;
        
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            // Vérifier si la position est valide
            if (nx >= 0 && ny >= 0 && nx < grid[0].length && ny < grid.length) {
                const adjacentCell = grid[ny][nx];
                
                // Si la cellule appartient au joueur et a plus d'une troupe
                if (adjacentCell.owner === playerId && adjacentCell.troopCount > 1) {
                    // Sélectionner la cellule avec le plus de troupes disponibles
                    if (adjacentCell.troopCount > maxTroops) {
                        maxTroops = adjacentCell.troopCount;
                        bestCell = { x: nx, y: ny, troopCount: adjacentCell.troopCount };
                    }
                }
            }
        }
        
        return bestCell;
    };
    
    // Déterminer si une cellule est attaquable directement (adjacente à une cellule du joueur)
    const isAttackableCell = (x, y) => {
        if (!localGameState || !localGameState.conquestGame || !localGameState.conquestGame.grid) return false;
        
        const grid = localGameState.conquestGame.grid;
        const cell = grid[y][x];
        const currentPlayer = players.find(p => p.username === username);
        if (!currentPlayer) return false;
        
        // Ne pas considérer comme attaquable si c'est déjà une case du joueur
        if (cell.owner === currentPlayer.id) return false;
        
        // Vérifier si une cellule adjacente appartient au joueur
        return findAdjacentPlayerCell(x, y, grid, currentPlayer.id) !== null;
    };
    
    // Gestionnaire de clic sur une cellule
    const handleCellClick = (x, y) => {
        if (!localGameState || !localGameState.conquestGame || !localGameState.conquestGame.grid || !socket) return;
        
        const grid = localGameState.conquestGame.grid;
        const cell = grid[y][x];
        
        // Si c'est une cellule du joueur
        const currentPlayer = players.find(p => p.username === username);
        if (!currentPlayer) return;
        
        if (cell.owner === currentPlayer.id) {
            // Sélection de cellule pour déplacement ultérieur ou comme source d'attaque
            setSelectedCell({ x, y });
        } 
        else if (selectedCell) {
            // Déjà une case sélectionnée - attaque ou déplacement classique
            const selectedCellData = grid[selectedCell.y][selectedCell.x];
            
            if (selectedCellData.owner === currentPlayer.id) {
                // Vérifier si les cellules sont adjacentes
                if (areCellsAdjacent(selectedCell.x, selectedCell.y, x, y)) {
                    // Cellules adjacentes
                    if (cell.owner === null || cell.owner !== currentPlayer.id) {
                        // Case neutre ou ennemie, attaquer
                        socket.emit('conquest-attack', {
                            roomId,
                            x, y,
                            troopCount: Math.floor((selectedCellData.troopCount - 1) * (attackPercent / 100))
                        });
                    }
                    else {
                        // Propre case, déplacer des troupes
                        socket.emit('conquest-move-troops', {
                            roomId,
                            fromX: selectedCell.x,
                            fromY: selectedCell.y,
                            toX: x,
                            toY: y,
                            troopCount: Math.floor((selectedCellData.troopCount - 1) * (attackPercent / 100))
                        });
                    }
                    
                    setSelectedCell(null);
                }
                else {
                    setMessage("Les cellules doivent être adjacentes");
                    setTimeout(() => setMessage(''), 2000);
                }
            }
        }
        else if (cell.owner !== currentPlayer.id) {
            // Cas d'amélioration ergonomique : attaque directe d'une case ennemie/neutre
            // Chercher une cellule adjacente appartenant au joueur qui peut servir de source d'attaque
            const attackSourceCell = findAdjacentPlayerCell(x, y, grid, currentPlayer.id);
            
            if (attackSourceCell) {
                // Lancer l'attaque directement depuis la meilleure cellule adjacente trouvée
                socket.emit('conquest-attack', {
                    roomId,
                    x, y,
                    troopCount: Math.floor((attackSourceCell.troopCount - 1) * (attackPercent / 100))
                });
                
                // Feedback visuel
                setMessage(`Attaque depuis (${attackSourceCell.x},${attackSourceCell.y}) avec ${Math.floor((attackSourceCell.troopCount - 1) * (attackPercent / 100))} troupes`);
                setTimeout(() => setMessage(''), 2000);
            } else {
                // Pas de cellule adjacente appartenant au joueur pour attaquer
                setMessage("Aucune cellule adjacente disponible pour attaquer");
                setTimeout(() => setMessage(''), 2000);
            }
        }
    };
    
    // Trouver toutes les cases neutres adjacentes aux cases du joueur
    const getAllNeutralCellsAdjacentToPlayer = () => {
        if (!localGameState || !localGameState.conquestGame || !localGameState.conquestGame.grid) return [];
        
        const grid = localGameState.conquestGame.grid;
        const currentPlayer = players.find(p => p.username === username);
        if (!currentPlayer) return [];
        
        const neutralCells = [];
        const visited = new Set();
        
        // Parcourir toutes les cases du joueur
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                if (grid[y][x].owner === currentPlayer.id) {
                    // Vérifier les 4 directions adjacentes
                    const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // haut, droite, bas, gauche
                    
                    for (const [dx, dy] of directions) {
                        const nx = x + dx;
                        const ny = y + dy;
                        
                        // Vérifier si la position est valide
                        if (nx >= 0 && ny >= 0 && nx < grid[0].length && ny < grid.length) {
                            const key = `${nx},${ny}`;
                            if (!visited.has(key) && grid[ny][nx].owner === null && grid[ny][nx].terrain !== 'water') {
                                visited.add(key);
                                neutralCells.push({ x: nx, y: ny, sourceCell: { x, y } });
                            }
                        }
                    }
                }
            }
        }
        
        return neutralCells;
    };
    
    // Trouver toutes les cases ennemies adjacentes aux cases du joueur
    const getAllEnemyCellsAdjacentToPlayer = () => {
        if (!localGameState || !localGameState.conquestGame || !localGameState.conquestGame.grid) return [];
        
        const grid = localGameState.conquestGame.grid;
        const currentPlayer = players.find(p => p.username === username);
        if (!currentPlayer) return [];
        
        const enemyCells = [];
        const visited = new Set();
        
        // Parcourir toutes les cases du joueur
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                if (grid[y][x].owner === currentPlayer.id) {
                    // Vérifier les 4 directions adjacentes
                    const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // haut, droite, bas, gauche
                    
                    for (const [dx, dy] of directions) {
                        const nx = x + dx;
                        const ny = y + dy;
                        
                        // Vérifier si la position est valide
                        if (nx >= 0 && ny >= 0 && nx < grid[0].length && ny < grid.length) {
                            const key = `${nx},${ny}`;
                            if (!visited.has(key) && 
                                grid[ny][nx].owner !== null && 
                                grid[ny][nx].owner !== currentPlayer.id && 
                                grid[ny][nx].terrain !== 'water') {
                                visited.add(key);
                                enemyCells.push({ x: nx, y: ny, sourceCell: { x, y } });
                            }
                        }
                    }
                }
            }
        }
        
        return enemyCells;
    };
    
    // Définir la couleur pour chaque cellule
    const getCellStyle = (cell, x, y) => {
        if (!localGameState || !localGameState.conquestGame) return {};
        
        const isSelected = selectedCell && selectedCell.x === x && selectedCell.y === y;
        const player = players.find(p => p.id === cell.owner);
        const attackable = isAttackableCell(x, y);
        
        let backgroundColor;
        let backgroundImage = 'none';
        
        // Couleurs de base selon le terrain
        if (cell.terrain === 'water') {
            backgroundColor = '#1e90ff'; // Bleu pour l'eau
            backgroundImage = 'radial-gradient(circle at 30% 30%, #5eb1ff 5%, #1e90ff 60%)';
        }
        else if (cell.terrain === 'mountain') {
            backgroundColor = '#8B4513'; // Marron pour les montagnes
            backgroundImage = 'linear-gradient(135deg, #8B4513 25%, #6B3100 50%, #8B4513 75%)';
        }
        else {
            backgroundColor = '#228B22'; // Vert pour les plaines
            backgroundImage = 'linear-gradient(135deg, #2ea12e 25%, #228B22 50%, #1d771d 75%)';
        }
        
        if (player) {
            // Case contrôlée par un joueur - utiliser un dégradé pour un effet plus dynamique
            backgroundColor = player.color;
            const lighterColor = player.color.replace(/rgb\((\d+), (\d+), (\d+)\)/, (_, r, g, b) => {
                return `rgb(${Math.min(255, parseInt(r) + 40)}, ${Math.min(255, parseInt(g) + 40)}, ${Math.min(255, parseInt(b) + 40)})`;
            });
            backgroundImage = `radial-gradient(circle at 30% 30%, ${lighterColor || player.color} 10%, ${player.color} 70%)`;
        }
        
        let border = '1px solid #222';
        let transform = 'none';
        let zIndex = 1;
        
        if (isSelected) {
            border = '3px solid white';
            transform = 'scale(1.15)';
            zIndex = 20;
            // La box-shadow sera ajoutée à la fin
        } else if (attackable) {
            // Style spécial pour les cases attaquables directement
            border = '2px dashed #FFD700';
            zIndex = 5;
        }
        
        return {
            backgroundColor,
            backgroundImage,
            border,
            position: 'relative',
            transform,
            zIndex,
            // Ajouter un effet visuel pour les cases attaquables
            boxShadow: attackable ? '0 0 12px rgba(255, 215, 0, 0.6)' : isSelected ? '0 0 15px rgba(255, 255, 255, 0.8)' : 'none',
        };
    };
    
    // Définir la taille des cellules en fonction de la taille de la grille
    const getCellSize = () => {
        if (!localGameState || !localGameState.conquestGame || !localGameState.conquestGame.mapConfig) {
            return 30; // Taille par défaut
        }
        
        const { mapConfig } = localGameState.conquestGame;
        const { rows, cols } = mapConfig;
        
        const maxDimension = Math.max(rows, cols);
        return Math.max(15, Math.min(30, 600 / maxDimension)); // Entre 15px et 30px
    };
    
    // Obtenir les soldats disponibles pour le joueur
    const getPlayerSoldiers = () => {
        if (!localGameState || !localGameState.conquestGame || !localGameState.conquestGame.grid) return 0;
        
        const grid = localGameState.conquestGame.grid;
        const currentPlayer = players.find(p => p.username === username);
        if (!currentPlayer) return 0;
        
        let totalSoldiers = 0;
        
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                if (grid[y][x].owner === currentPlayer.id) {
                    totalSoldiers += grid[y][x].troopCount;
                }
            }
        }
        
        return totalSoldiers;
    };
    
    // Obtenir les cellules contrôlées par le joueur
    const getPlayerCells = () => {
        if (!localGameState || !localGameState.conquestGame || !localGameState.conquestGame.grid) return 0;
        
        const grid = localGameState.conquestGame.grid;
        const currentPlayer = players.find(p => p.username === username);
        if (!currentPlayer) return 0;
        
        let cellCount = 0;
        
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                if (grid[y][x].owner === currentPlayer.id) {
                    cellCount++;
                }
            }
        }
        
        return cellCount;
    };
    
    // Obtenir le nombre total de cellules contrôlées (par tous les joueurs)
    const getTotalControlledCells = () => {
        if (!localGameState || !localGameState.conquestGame || !localGameState.conquestGame.grid) {
            return { controlledCount: 0, totalValidCount: 0 };
        }
        
        const grid = localGameState.conquestGame.grid;
        let controlledCount = 0;
        let totalValidCount = 0; // Ignorer les cellules d'eau
        
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                if (grid[y][x].terrain !== 'water') {
                    totalValidCount++;
                    if (grid[y][x].owner) {
                        controlledCount++;
                    }
                }
            }
        }
        
        return { controlledCount, totalValidCount };
    };
    
    // Fin du tour du joueur
    const endTurn = () => {
        if (!socket || !roomId) return;
        
        socket.emit('conquest-end-turn', { roomId });
        setMessage('Tour terminé');
        setTimeout(() => setMessage(''), 2000);
    };
    
    // Formatter la taille de la grille pour affichage
    const formatGridSize = () => {
        if (!localGameState || !localGameState.conquestGame || !localGameState.conquestGame.mapConfig) return '';
        const { rows, cols } = localGameState.conquestGame.mapConfig;
        return `${rows}×${cols}`;
    };
    
    // Formatter la difficulté pour affichage
    const formatDifficulty = () => {
        if (!localGameState || !localGameState.conquestGame || !localGameState.conquestGame.difficulty) return '';
        return localGameState.conquestGame.difficulty.name || 'Moyen';
    };
    
    // Rendu du composant
    if (!localGameState || !localGameState.conquestGame || !localGameState.conquestGame.grid) {
        console.error('🚫 ConquestBoard - Données manquantes:', {
            hasLocalGameState: !!localGameState,
            gameStateKeys: localGameState ? Object.keys(localGameState) : [],
            conquestGame: localGameState ? localGameState.conquestGame : null,
        });
        
        // Créer un état de jeu par défaut si les données sont manquantes
        if (!localGameState && gameState) {
            console.log('🔄 Tentative de création d\'un état par défaut depuis:', gameState);
            
            // Si gameState contient directement les données de grille
            if (gameState.grid) {
                const defaultState = { conquestGame: gameState };
                console.log('📊 État par défaut créé:', defaultState);
                
                // Mettre à jour l'état local avec l'état par défaut
                setTimeout(() => setLocalGameState(defaultState), 100);
            }
        }
        
        return (
            <div className="loading">
                <h3>Chargement du jeu de conquête...</h3>
                <div className="loading-spinner"></div>
                
                <div className="debug-info" style={{ marginTop: '20px', fontSize: '12px', opacity: 0.7 }}>
                    <p>Si le chargement semble bloqué, voici les informations de débogage:</p>
                    <ul style={{ textAlign: 'left', listStyle: 'none' }}>
                        <li>État du jeu reçu: {gameState ? '✅' : '❌'}</li>
                        <li>État local: {localGameState ? '✅' : '❌'}</li>
                        <li>Joueurs connectés: {players.length}</li>
                        <li>Structure: {gameState ? Object.keys(gameState).join(', ') : 'N/A'}</li>
                    </ul>
                    <button 
                        onClick={() => {
                            if (gameState && gameState.grid) {
                                setLocalGameState({ conquestGame: gameState });
                            }
                        }}
                        style={{ marginTop: '10px' }}
                    >
                        Forcer le chargement
                    </button>
                </div>
            </div>
        );
    }
    
    const { controlledCount, totalValidCount } = getTotalControlledCells();
    const controlPercentage = totalValidCount > 0 ? Math.floor((controlledCount / totalValidCount) * 100) : 0;
    const cellSize = getCellSize();
    const grid = localGameState.conquestGame.grid;
    
    // Attaque en zone - conquérir toutes les cases neutres adjacentes
    const attackNeutralZone = () => {
        const neutralCells = getAllNeutralCellsAdjacentToPlayer();
        
        if (neutralCells.length === 0) {
            setMessage("Aucune case neutre adjacente à conquérir");
            setTimeout(() => setMessage(''), 2000);
            return false;
        }
        
        // Calcul des troupes disponibles pour l'attaque
        const totalSoldiers = getPlayerSoldiers();
        const maxTroops = Math.floor(totalSoldiers * (attackPercent / 100));
        
        if (maxTroops < neutralCells.length) {
            setMessage(`Pas assez de troupes pour conquérir ${neutralCells.length} cases (${maxTroops} disponibles)`);
            setTimeout(() => setMessage(''), 2000);
            return false;
        }
        
        // Calculer le nombre de troupes par case à conquérir
        const troopsPerCell = Math.floor(maxTroops / neutralCells.length);
        
        // Stocker le nombre de troupes en attaque pour le feedback visuel
        setAttackingSoldiers(maxTroops);
        setMessage(`⚔️ Conquête en cours: 0/${neutralCells.length} cases...`);
        
        // Envoyer les attaques au serveur avec un délai entre chaque pour créer un effet séquentiel
        let conquestCount = 0;
        const animateCellConquest = (index) => {
            if (index >= neutralCells.length) {
                setAttackingSoldiers(0);
                setMessage(`✅ Conquête terminée: ${conquestCount} cases neutres conquises`);
                setTimeout(() => setMessage(''), 3000);
                return;
            }
            
            const cell = neutralCells[index];
            
            // Créer un effet visuel sur la cellule
            const cellElement = document.querySelector(`.conquest-cell[data-x="${cell.x}"][data-y="${cell.y}"]`);
            if (cellElement) {
                cellElement.classList.add('cell-conquering');
                setTimeout(() => cellElement.classList.remove('cell-conquering'), 500);
            }
            
            // Envoyer l'attaque au serveur
            socket.emit('conquest-attack', {
                roomId,
                x: cell.x,
                y: cell.y,
                troopCount: troopsPerCell
            });
            
            conquestCount++;
            setAttackingSoldiers(prev => Math.max(0, prev - troopsPerCell));
            setMessage(`⚔️ Conquête en cours: ${conquestCount}/${neutralCells.length} cases...`);
            
            // Passer à la cellule suivante après un délai
            setTimeout(() => animateCellConquest(index + 1), 200);
        };
        
        // Démarrer l'animation
        animateCellConquest(0);
        
        return true;
    };
    
    // Attaque en zone - attaquer toutes les cases ennemies adjacentes
    const attackEnemyZone = () => {
        const enemyCells = getAllEnemyCellsAdjacentToPlayer();
        
        if (enemyCells.length === 0) {
            setMessage("Aucune case ennemie adjacente à attaquer");
            setTimeout(() => setMessage(''), 2000);
            return false;
        }
        
        // Calcul des troupes disponibles pour l'attaque
        const totalSoldiers = getPlayerSoldiers();
        const maxTroops = Math.floor(totalSoldiers * (attackPercent / 100));
        
        if (maxTroops < enemyCells.length * 2) { // 2 troupes minimum par case ennemie
            setMessage(`Pas assez de troupes pour attaquer ${enemyCells.length} cases ennemies (${maxTroops} disponibles)`);
            setTimeout(() => setMessage(''), 2000);
            return false;
        }
        
        // Calculer le nombre de troupes par case à attaquer
        const troopsPerCell = Math.floor(maxTroops / enemyCells.length);
        
        // Stocker le nombre de troupes en attaque pour le feedback visuel
        setAttackingSoldiers(maxTroops);
        setMessage(`🔥 Attaque en cours: 0/${enemyCells.length} cases ennemies...`);
        
        // Envoyer les attaques au serveur avec un délai plus long pour créer un effet de bataille
        let attackCount = 0;
        const animateCellAttack = (index) => {
            if (index >= enemyCells.length) {
                setAttackingSoldiers(0);
                setMessage(`✅ Attaque terminée: ${attackCount} cases ennemies attaquées`);
                setTimeout(() => setMessage(''), 3000);
                return;
            }
            
            const cell = enemyCells[index];
            
            // Créer un effet visuel sur la cellule
            const cellElement = document.querySelector(`.conquest-cell[data-x="${cell.x}"][data-y="${cell.y}"]`);
            if (cellElement) {
                cellElement.classList.add('cell-attacking');
                setTimeout(() => cellElement.classList.remove('cell-attacking'), 800);
            }
            
            // Envoyer l'attaque au serveur
            socket.emit('conquest-attack', {
                roomId,
                x: cell.x,
                y: cell.y,
                troopCount: troopsPerCell
            });
            
            attackCount++;
            setAttackingSoldiers(prev => Math.max(0, prev - troopsPerCell));
            setMessage(`🔥 Attaque en cours: ${attackCount}/${enemyCells.length} cases ennemies...`);
            
            // Passer à la cellule suivante après un délai plus long pour les attaques
            setTimeout(() => animateCellAttack(index + 1), 400);
        };
        
        // Démarrer l'animation
        animateCellAttack(0);
        
        return true;
    };
    
    return (
        <div className="conquest-board">
            <h1 className="conquest-header">Jeu de Conquête</h1>
            
            {message && <div className="conquest-message">{message}</div>}
            
            <div className="conquest-stats">
                <div className="stat-item">
                    <span className="stat-label">Joueur</span>
                    <span className="stat-value">{username}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Taille</span>
                    <span className="stat-value">{formatGridSize()}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Difficulté</span>
                    <span className="stat-value">{formatDifficulty()}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Tour</span>
                    <span className="stat-value">{localGameState.conquestGame?.currentTurn || 1}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Territoires</span>
                    <span className="stat-value">{getPlayerCells()}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Soldats</span>
                    <span className="stat-value">{getPlayerSoldiers()}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Contrôle global</span>
                    <span className="stat-value">{controlPercentage}%</span>
                </div>
                {attackingSoldiers > 0 && (
                    <div className="stat-item attacking">
                        <span className="stat-label">En attaque</span>
                        <span className="stat-value attack-value">{attackingSoldiers}</span>
                    </div>
                )}
            </div>
            
            <div className="attack-controls">
                <div className="attack-percent-control">
                    <label htmlFor="attack-range" className="attack-percent-label">
                        Force d'attaque: {attackPercent}%
                    </label>
                    <input 
                        id="attack-range"
                        type="range" 
                        min="10" 
                        max="100" 
                        value={attackPercent} 
                        onChange={(e) => setAttackPercent(parseInt(e.target.value))}
                    />
                </div>
                
                <div className="conquest-actions">
                    <div className="attack-buttons">
                        <button 
                            className="neutral-attack-button" 
                            onClick={attackNeutralZone}
                            title="Conquérir toutes les cases neutres adjacentes à vos territoires"
                            disabled={attackingSoldiers > 0}
                        >
                            <span className="button-icon">🌿</span>
                            <div className="button-content">
                                <span className="button-title">Conquérir neutres</span>
                                <span className="button-desc">{getAllNeutralCellsAdjacentToPlayer().length} cases disponibles</span>
                            </div>
                        </button>
                        <button 
                            className="enemy-attack-button" 
                            onClick={attackEnemyZone}
                            title="Attaquer toutes les cases ennemies adjacentes à vos territoires"
                            disabled={attackingSoldiers > 0}
                        >
                            <span className="button-icon">⚔️</span>
                            <div className="button-content">
                                <span className="button-title">Attaquer ennemis</span>
                                <span className="button-desc">{getAllEnemyCellsAdjacentToPlayer().length} cases adjacentes</span>
                            </div>
                        </button>
                    </div>
                    
                    <button 
                        className="end-turn-button" 
                        onClick={endTurn}
                        disabled={attackingSoldiers > 0}
                    >
                        <span className="button-icon">🔄</span>
                        <span className="button-title">Fin du tour</span>
                    </button>
                </div>
                
                <div className="attack-info-panel">
                    <div className="attack-tip">
                        <i className="info-icon">ℹ️</i>
                        <span>Astuce : Cliquez directement sur une case ennemie ou neutre adjacente à votre territoire pour l'attaquer</span>
                    </div>
                    
                    <div className="attack-stats">
                        <div className="attack-stat-item">
                            <span className="attack-stat-icon">🎯</span>
                            <span className="attack-stat-label">Cases neutres adjacentes:</span>
                            <span className="attack-stat-value">{getAllNeutralCellsAdjacentToPlayer().length}</span>
                        </div>
                        <div className="attack-stat-item">
                            <span className="attack-stat-icon">⚔️</span>
                            <span className="attack-stat-label">Cases ennemies adjacentes:</span>
                            <span className="attack-stat-value">{getAllEnemyCellsAdjacentToPlayer().length}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="conquest-grid-container">
                <div 
                    className="conquest-grid" 
                    ref={gridRef}
                    style={{
                        gridTemplateColumns: `repeat(${grid[0]?.length || 1}, ${cellSize}px)`,
                        gridTemplateRows: `repeat(${grid.length || 1}, ${cellSize}px)`
                    }}
                >
                    {grid.map((row, y) => (
                        row.map((cell, x) => {
                            const isAttackable = isAttackableCell(x, y);
                            return (
                                <div 
                                    key={`${x}-${y}`}
                                    data-x={x}
                                    data-y={y}
                                    className={`conquest-cell ${cell.terrain} 
                                              ${selectedCell?.x === x && selectedCell?.y === y ? 'selected-cell' : ''} 
                                              ${isAttackable ? 'attackable-cell' : ''}`}
                                    style={{
                                        width: `${cellSize}px`,
                                        height: `${cellSize}px`,
                                        ...getCellStyle(cell, x, y)
                                    }}
                                    onClick={() => handleCellClick(x, y)}
                                >
                                    {cell.troopCount > 0 && (
                                        <span className={`troop-count ${cell.owner === players.find(p => p.username === username)?.id ? 'troop-own' : cell.owner ? 'troop-enemy' : 'troop-neutral'}`}>
                                            {cell.troopCount}
                                        </span>
                                    )}
                                    {cell.terrain === 'mountain' && <span className="terrain-icon">⛰️</span>}
                                    {cell.terrain === 'water' && <span className="terrain-icon">🌊</span>}
                                </div>
                            );
                        })
                    ))}
                </div>
            </div>
            
            <div className="conquest-players">
                {players.map((player, index) => (
                    <div key={player.id} className="player-badge">
                        <div 
                            className="player-color" 
                            style={{ backgroundColor: player.color }}
                        ></div>
                        <span>{player.username}</span>
                        <div className={`player-status ${player.connected ? 'player-online' : 'player-offline'}`}></div>
                    </div>
                ))}
            </div>
            
            <ConquestRules />
        </div>
    );
}

export default ConquestBoard;
