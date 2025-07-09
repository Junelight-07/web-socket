import React, { useState } from 'react';

const GameRules = () => {
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
                            <h3>🧩 Règles du Puzzle Collaboratif</h3>
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
                                <p>Reconstituer le puzzle en plaçant toutes les pièces à leur position correcte.</p>
                            </div>
                            
                            <div className="rule-section">
                                <h4>👥 Mode Collaboratif</h4>
                                <ul>
                                    <li>Jusqu'à <strong>4 joueurs</strong> peuvent participer</li>
                                    <li>Travaillez ensemble pour terminer le puzzle</li>
                                    <li>Communiquez pour éviter de vous gêner</li>
                                </ul>
                            </div>
                            
                            <div className="rule-section">
                                <h4>🎮 Comment jouer</h4>
                                <ul>
                                    <li><strong>Cliquer et maintenir</strong> sur une pièce pour la saisir</li>
                                    <li><strong>Glisser</strong> la pièce vers sa position</li>
                                    <li><strong>Relâcher</strong> pour déposer la pièce</li>
                                    <li>Les pièces <span style={{color: '#4CAF50'}}>vertes</span> sont bien placées</li>
                                </ul>
                            </div>
                            
                            <div className="rule-section">
                                <h4>⚠️ Règles importantes</h4>
                                <ul>
                                    <li>Une seule personne peut tenir une pièce à la fois</li>
                                    <li>Les pièces tenues par d'autres sont <span style={{opacity: 0.5}}>grisées</span></li>
                                    <li>Les pièces bien placées ne peuvent plus être déplacées</li>
                                </ul>
                            </div>
                            
                            <div className="rule-section">
                                <h4>🏆 Victoire</h4>
                                <p>Le puzzle est terminé quand toutes les pièces sont correctement placées !</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameRules;
