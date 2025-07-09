import React from 'react';

const UserCursors = ({ cursors, currentUserId }) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    const colorMap = React.useMemo(() => {
        const map = {};
        Object.keys(cursors).forEach((userId, index) => {
            map[userId] = colors[index % colors.length];
        });
        return map;
    }, [Object.keys(cursors).length]);

    return (
        <>
            {Object.entries(cursors).map(([userId, cursor]) => {
                if (userId === currentUserId) return null;

                return (
                    <div
                        key={userId}
                        className="user-cursor"
                        style={{
                            left: cursor.x,
                            top: cursor.y,
                            transform: 'translate(-50%, -50%)',
                            position: 'absolute',
                            pointerEvents: 'none',
                            zIndex: 1000
                        }}
                    >
                        <div
                            className="cursor-pointer"
                            style={{
                                width: '20px',
                                height: '20px',
                                backgroundColor: colorMap[userId],
                                borderRadius: '50%',
                                border: '2px solid white',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                        />
                        <div
                            className="cursor-label"
                            style={{
                                position: 'absolute',
                                top: '25px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: colorMap[userId],
                                color: 'white',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }}
                        >
                            {cursor.username}
                        </div>
                    </div>
                );
            })}
        </>
    );
};

export default UserCursors;
