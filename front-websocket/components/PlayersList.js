import React from 'react';

const PlayersList = ({ users, currentUser }) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

    const getActivityStatus = (user) => {
        const now = Date.now();
        const lastActivity = user.lastActivity || now;
        const timeDiff = now - lastActivity;

        if (timeDiff < 10000) return 'active';
        if (timeDiff < 60000) return 'idle';
        return 'away';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#4CAF50';
            case 'idle': return '#FF9800';
            case 'away': return '#757575';
            default: return '#757575';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'active': return 'Actif';
            case 'idle': return 'Inactif';
            case 'away': return 'Absent';
            default: return 'Hors ligne';
        }
    };

    return (
        <div className="players-list">
            <h3>Joueurs ({users.length})</h3>
            <div className="players-container">
                {users.map((user, index) => {
                    const status = getActivityStatus(user);
                    const isCurrentUser = user.id === currentUser.id;

                    return (
                        <div key={user.id} className={`player-item ${isCurrentUser ? 'current' : ''}`}>
                            <div
                                className="player-avatar"
                                style={{
                                    backgroundColor: colors[index % colors.length],
                                    color: 'white'
                                }}
                            >
                                {user.username.charAt(0).toUpperCase()}
                            </div>

                            <div className="player-info">
                                <div className="player-name">
                                    {user.username}
                                    {isCurrentUser && <span className="you-indicator">(Vous)</span>}
                                </div>

                                <div className="player-status">
                                    <div
                                        className="status-dot"
                                        style={{ backgroundColor: getStatusColor(status) }}
                                    />
                                    <span className="status-text">{getStatusText(status)}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PlayersList;
