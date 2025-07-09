import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const useSocket = (serverUrl) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const newSocket = io(serverUrl);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connecté au serveur');
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Déconnecté du serveur');
            setIsConnected(false);
        });

        return () => {
            newSocket.close();
        };
    }, [serverUrl]);

    return { socket, isConnected };
};

export default useSocket;
