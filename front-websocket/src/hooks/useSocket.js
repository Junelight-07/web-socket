import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export const useSocket = () => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // URL du backend depuis les variables d'environnement ou localhost par défaut
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
        console.log('🔌 Connexion au backend:', backendUrl);
        
        const newSocket = io(backendUrl);
        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    return socket;
};
