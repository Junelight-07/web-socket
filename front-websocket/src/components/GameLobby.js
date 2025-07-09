import React, { useState } from 'react';

const GameLobby = ({ onCreateRoom, onJoinRoom }) => {
    const [username, setUsername] = useState('');
    const [roomId, setRoomId] = useState('');

    return (
        <div>
            <h2>🎮 Lobby du Jeu</h2>
            <div>
                <input
                    type="text"
                    placeholder="Votre nom"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <button onClick={() => onCreateRoom(username)}>
                    Créer une partie
                </button>
            </div>
            <div>
                <input
                    type="text"
                    placeholder="Code de la partie"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                />
                <button onClick={() => onJoinRoom(roomId, username)}>
                    Rejoindre
                </button>
            </div>
        </div>
    );
};

export default GameLobby;
