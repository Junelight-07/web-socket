import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export const useSocket = () => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Utilise l'IP Wi-Fi pour une meilleure connectivité réseau
        const newSocket = io('http://10.2.165.123:3001');
        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    return socket;
};
