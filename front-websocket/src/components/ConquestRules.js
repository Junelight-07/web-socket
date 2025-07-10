import React, { useState } from 'react';

const ConquestRules = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="game-rules">
            <button 
                className="rules-button"
                onClick={() => setIsOpen(!isOpen)}
            >
                📋 Règles du jeu
            </button>
            
            {isOpen && (
                <div className="rules-modal">
                    <div className="rules-content">
                        <div className="rules-header">
                            <h3>🏰 Règles du Jeu de Conquête</h3>
                            <button 
                                className="close-rules"
                                onClick={() => setIsOpen(false)}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="rules-body">
                            <div className="rule-section">
                                <h4>🎯 Objectif</h4>
                                <p>Conquérir le territoire en contrôlant au moins 80% de la carte ou en éliminant tous les autres joueurs.</p>
                            </div>
                            
                            <div className="rule-section">
                                <h4>👥 Mode Multijoueur</h4>
                                <ul>
                                    <li>Chaque joueur commence avec une cellule aléatoire sur la carte</li>
                                    <li>Les joueurs s'affrontent pour conquérir le territoire</li>
                                    <li>Possibilité de jouer jusqu'à 8 joueurs simultanément</li>
                                </ul>
                            </div>
                            
                            <div className="rule-section">
                                <h4>🎮 Comment jouer</h4>
                                <ul>
                                    <li><strong>Sélectionner</strong> une de vos cellules (bordure blanche)</li>
                                    <li><strong>Cliquer</strong> sur une cellule adjacente pour attaquer ou déplacer des troupes</li>
                                    <li><strong>Ajuster</strong> la force d'attaque avec le curseur (pourcentage)</li>
                                </ul>
                            </div>
                            
                            <div className="rule-section">
                                <h4>🏞️ Types de terrain</h4>
                                <ul>
                                    <li><strong>Plaine</strong> (vert) : Terrain standard</li>
                                    <li><strong>Montagne</strong> (marron) : Bonus défensif de 50%</li>
                                    <li><strong>Eau</strong> (bleu) : Infranchissable et non conquérable</li>
                                </ul>
                            </div>
                            
                            <div className="rule-section">
                                <h4>⚔️ Système de combat</h4>
                                <ul>
                                    <li>Pour attaquer, vous devez utiliser des troupes de cellules adjacentes</li>
                                    <li>L'attaquant gagne si sa force d'attaque &gt; force de défense</li>
                                    <li>Les troupes restantes après victoire = Attaque - Défense</li>
                                    <li>Vous devez toujours laisser au moins 1 troupe sur chaque cellule</li>
                                </ul>
                            </div>
                            
                            <div className="rule-section">
                                <h4>💰 Ressources</h4>
                                <ul>
                                    <li>Chaque cellule génère 1 nouvelle troupe par tour</li>
                                    <li>Plus vous contrôlez de territoire, plus vous générez de troupes</li>
                                </ul>
                            </div>
                            
                            <div className="rule-section">
                                <h4>🏆 Conditions de victoire</h4>
                                <ul>
                                    <li>Contrôler au moins 80% du territoire conquérable</li>
                                    <li>OU être le dernier joueur avec des territoires</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConquestRules;
