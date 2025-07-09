import React, { useState } from 'react';

const GameLobby = ({ onJoinRoom, socket }) => {
    const [username, setUsername] = useState('');
    const [roomId, setRoomId] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleJoinRoom = (e) => {
        e.preventDefault();
        if (username.trim() && roomId.trim()) {
            onJoinRoom(roomId, username);
        }
    };

    const createNewRoom = async () => {
        if (!username.trim()) {
            alert('Veuillez entrer votre nom');
            return;
        }

        setIsCreating(true);
        try {
            const response = await fetch('http://localhost:5000/api/create-room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const { roomId: newRoomId } = await response.json();
            onJoinRoom(newRoomId, username);
        } catch (error) {
            console.error('Erreur création room:', error);
            alert('Erreur lors de la création de la room');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="lobby">
            <div className="lobby-container">
                <h1>🧩 Puzzle Collaboratif</h1>

                <div className="user-input">
                    <input
                        type="text"
                        placeholder="Votre nom"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        maxLength={20}
                    />
                </div>

                <div className="room-section">
                    <h3>Rejoindre une room</h3>
                    <form onSubmit={handleJoinRoom}>
                        <input
                            type="text"
                            placeholder="ID de la room"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                            maxLength={8}
                        />
                        <button type="submit" disabled={!username.trim() || !roomId.trim()}>
                            Rejoindre
                        </button>
                    </form>
                </div>

                <div className="divider">OU</div>

                <div className="create-section">
                    <button
                        onClick={createNewRoom}
                        disabled={!username.trim() || isCreating}
                        className="create-btn"
                    >
                        {isCreating ? 'Création...' : 'Créer une nouvelle room'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GameLobby;
