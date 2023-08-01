// app/providers.tsx
'use client';

import { SocketProvider } from '@/context/SocketContext';
import { CacheProvider } from '@chakra-ui/next-js';
import { ChakraProvider } from '@chakra-ui/react';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <CacheProvider>
            <ChakraProvider>
                <SocketProvider>{children}</SocketProvider>
            </ChakraProvider>
        </CacheProvider>
    );
}
