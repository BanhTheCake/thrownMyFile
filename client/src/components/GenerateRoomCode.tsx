'use client';

import {
    Button,
    HStack,
    IconButton,
    Input,
    InputGroup,
    InputLeftAddon,
    Text,
    ToastId,
    useToast,
} from '@chakra-ui/react';
import { FC, useState, ChangeEvent, useEffect, useRef } from 'react';
import { ChatIcon, CopyIcon, RepeatIcon } from '@chakra-ui/icons';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useSocket } from '@/context/SocketContext';

interface GenerateRoomCodeProps {}

function generateRandomString() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const length = 6;
    let result = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters.charAt(randomIndex);
    }

    return result;
}

async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Error copying text:', err);
        return false;
    }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const GenerateRoomCode: FC<GenerateRoomCodeProps> = ({}) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const { socket, currentRoom, setCurrentRoom } = useSocket();
    const toast = useToast();

    const toastCopyIdRef = useRef<ToastId>();
    const [code, setCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    const onChangeInput = (e: ChangeEvent<HTMLInputElement>) => {
        setCode((prev) => {
            if (e.target.value.trim().length <= 6) {
                return e.target.value.trim().toUpperCase();
            }
            return prev;
        });
    };

    const onRegenerate = () => {
        router.push(`${pathname}?roomCode=${generateRandomString()}`);
    };

    const onCopy = async () => {
        await copyToClipboard(code);
        if (toastCopyIdRef.current && toast.isActive(toastCopyIdRef.current)) {
            toast.close(toastCopyIdRef.current);
        }
        toastCopyIdRef.current = toast({
            title: 'Copied to clipboard',
            status: 'success',
            isClosable: true,
            duration: 2000,
            position: 'top-right',
        });
    };

    const onJoinRoom = () => {
        if (!socket) return;
        if (currentRoom === code) {
            toast({
                title: 'Already joined this room',
                status: 'error',
                duration: 2000,
                isClosable: true,
                position: 'top-right',
            });
            return;
        }
        socket.emit('join_room', {
            currentRoom: currentRoom,
            newRoom: code,
        });
        setIsJoining(true);
        router.push(`${pathname}?roomCode=${code}`);
    };

    useEffect(() => {
        const roomCode = searchParams.get('roomCode');
        if (roomCode) {
            setCode(roomCode);
            return;
        }
        router.push(`${pathname}?roomCode=${generateRandomString()}`);
    }, [searchParams, pathname, router]);

    useEffect(() => {
        if (!socket) return;
        let roomCode = searchParams.get('roomCode');
        if (!roomCode) {
            roomCode = generateRandomString();
        }
        router.push(`${pathname}?roomCode=${roomCode}`);
        socket.emit('join_room', {
            currentRoom: currentRoom,
            newRoom: roomCode,
        });
    }, [socket]);

    useEffect(() => {
        if (!socket) return;
        socket.on('join_room_success', async (code: string) => {
            setCurrentRoom(code);
            await delay(500);
            setIsJoining(false);
            toast({
                title: 'Joined room successfully',
                status: 'success',
                isClosable: true,
                duration: 2000,
                position: 'top-right',
            });
        });
        socket.on('join_room_failed', async () => {
            setCurrentRoom('');
            await delay(500);
            setIsJoining(false);
            toast({
                title: 'Failed to join room',
                status: 'error',
                isClosable: true,
                duration: 2000,
                position: 'top-right',
            });
        });
        return () => {
            socket.off('join_room_success');
            socket.off('join_room_failed');
        };
    }, [socket, toast, setCurrentRoom]);

    return (
        <>
            <HStack>
                <Text fontSize={'sm'}>Transfer Code: </Text>
                <Text>{code}</Text>
                <CopyIcon
                    boxSize={6}
                    color={'purple.400'}
                    cursor={'pointer'}
                    _hover={{
                        color: 'purple.600',
                    }}
                    transition={'all 0.2s ease-in-out'}
                    onClick={onCopy}
                />
            </HStack>
            <HStack spacing={3}>
                {/* <Input
                    bgColor={'blackAlpha.100'}
                    placeholder="Generate Code"
                    value={code}
                    onChange={onChangeInput}
                /> */}
                <InputGroup>
                    <InputLeftAddon>
                        <ChatIcon />
                    </InputLeftAddon>
                    <Input
                        bgColor={'blackAlpha.50'}
                        placeholder="Generate Code"
                        _placeholder={{ color: 'gray.500' }}
                        value={code}
                        onChange={onChangeInput}
                    />
                </InputGroup>
                <IconButton
                    aria-label="Regenerate"
                    icon={<RepeatIcon />}
                    colorScheme="teal"
                    onClick={onRegenerate}
                />
                <Button
                    colorScheme="green"
                    paddingX={'4'}
                    onClick={onJoinRoom}
                    isLoading={isJoining}
                >
                    Join
                </Button>
            </HStack>
        </>
    );
};

export default GenerateRoomCode;
