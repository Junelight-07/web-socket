import React from 'react';

const GameBoard = ({ socket, roomId, username }) => {
    return (
        <div className="game-board">
            <div className="board-header">
                <h2>🎯 Partie en cours</h2>
                <p>Room: {roomId} | Joueur: {username}</p>
            </div>

            <div className="puzzle-container">
                <div className="puzzle-area">
                    <p>Le puzzle sera affiché ici</p>
                    <p>Websocket connecté : {socket ? '✅' : '❌'}</p>
                </div>
            </div>
        </div>
    );
};

export default GameBoard;
