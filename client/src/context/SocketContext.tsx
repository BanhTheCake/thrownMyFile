import { error } from 'console';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

type TSocketContext = {
    socket: Socket | null;
    currentRoom: string;
    setCurrentRoom: React.Dispatch<React.SetStateAction<string>>;
} | null;

export const socketContext = React.createContext<TSocketContext>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [currentRoom, setCurrentRoom] = useState('');
    useEffect(() => {
        const socketInit = io(process.env.NEXT_PUBLIC_BACKEND_URL || '');
        socketInit.on('connect', () => {
            setSocket(socketInit);
        });
        return () => {
            socketInit.disconnect();
        };
    }, []);
    const data = useMemo<TSocketContext>(() => {
        return {
            currentRoom: currentRoom,
            setCurrentRoom: setCurrentRoom,
            socket: socket,
        };
    }, [currentRoom, socket, setCurrentRoom]);
    return (
        <socketContext.Provider value={data}>{children}</socketContext.Provider>
    );
};

export const useSocket = () => {
    const data = useContext(socketContext);
    if (!data) {
        throw new Error('`useSocket` must be used within a `SocketProvider`');
    }
    return data;
};
