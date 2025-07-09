import React, { useState, useEffect, useRef } from 'react';

const ChatPanel = ({ socket, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        socket.on('chat-message', (message) => {
            setMessages(prev => [...prev, message]);
        });

        return () => {
            socket.off('chat-message');
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (inputMessage.trim()) {
            socket.emit('chat-message', { message: inputMessage.trim() });
            setInputMessage('');
        }
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={`chat-panel ${isOpen ? 'open' : ''}`}>
            <div className="chat-header" onClick={() => setIsOpen(!isOpen)}>
                <span>💬 Chat</span>
                <span className="toggle-icon">{isOpen ? '▼' : '▶'}</span>
            </div>

            {isOpen && (
                <div className="chat-content">
                    <div className="messages-container">
                        {messages.length === 0 ? (
                            <div className="no-messages">
                                Aucun message pour le moment...
                            </div>
                        ) : (
                            messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`message ${msg.userId === currentUser.id ? 'own' : 'other'}`}
                                >
                                    <div className="message-header">
                                        <span className="username">{msg.username}</span>
                                        <span className="timestamp">{formatTime(msg.timestamp)}</span>
                                    </div>
                                    <div className="message-content">{msg.message}</div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="message-form" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Tapez votre message..."
                            maxLength={200}
                        />
                        <button type="submit" disabled={!inputMessage.trim()}>
                            Envoyer
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ChatPanel;
