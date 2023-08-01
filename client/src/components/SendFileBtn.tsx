'use client';

import { FC, useEffect, useState, useRef } from 'react';
import { Button, Text, VStack, useToast } from '@chakra-ui/react';
import { AttachmentIcon } from '@chakra-ui/icons';
import { useSocket } from '@/context/SocketContext';
import debounce from 'lodash.debounce';

interface SocketFileProps {}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const SendFileBtn: FC<SocketFileProps> = ({}) => {
    const { socket, currentRoom } = useSocket();
    const [progress, setProgress] = useState<number | null>(null);
    const [totalSizeFile, setTotalSizeFile] = useState<number>(0);
    const [currentSizeFile, setCurrentSizeFile] = useState<number>(0);
    const [sendingFile, setSendingFile] = useState(false);

    const bufferRef = useRef<any>(null);
    const toast = useToast();

    // reset state when sender has cancel the file or error in server !
    const resetIfFileError = debounce(() => {
        setSendingFile(false);
        setProgress(null);
        toast({
            title: 'Sending file failed!',
            status: 'error',
            duration: 2000,
            isClosable: true,
            position: 'top-right',
        });
    }, 5000);

    useEffect(() => {
        if (!socket) return;

        socket.on('upload_progress', (data: any) => {
            const { chunk, progress, isLast, name } = data;
            let fileBufferTmp: any = null;

            if (!bufferRef.current) {
                fileBufferTmp = chunk;
            } else {
                // Concatenate the new chunk to the existing buffer
                const combinedBuffer = new Uint8Array(
                    bufferRef.current.byteLength + chunk.byteLength
                );
                combinedBuffer.set(new Uint8Array(bufferRef.current), 0);
                combinedBuffer.set(
                    new Uint8Array(chunk),
                    bufferRef.current.byteLength
                );
                fileBufferTmp = combinedBuffer.buffer;
            }

            if (isLast) {
                const blob = new Blob([fileBufferTmp], {
                    type: 'application/octet-stream',
                });
                // Create an anchor link and trigger the download
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = name;
                link.click();
                bufferRef.current = null;
                return;
            }
            bufferRef.current = fileBufferTmp;
        });
        socket.on('progress', (data: any) => {
            const { progress, chunkSizeInMB, fileSizeInMb } = data;
            setProgress(Math.round(progress));
            setTotalSizeFile(fileSizeInMb);
            setCurrentSizeFile((prev) => prev + chunkSizeInMB);
            if (progress === 100) {
                setProgress(null);
                setSendingFile(false);
                resetIfFileError.cancel();
                toast({
                    title: 'Sending file completed!',
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                    position: 'top-right',
                });
            } else {
                resetIfFileError();
            }
        });
        socket.on('sending_file', (_) => {
            setSendingFile(true);
            setCurrentSizeFile(0);
        });
        return () => {
            socket.off('upload_progress');
            socket.off('progress');
            socket.off('sending_file');
        };
    }, [socket]);

    return (
        <VStack alignItems={'start'}>
            <VStack spacing={'0.5'} alignItems={'start'}>
                {totalSizeFile && (
                    <Text fontSize={'sm'}>
                        Transferred: {Math.round(currentSizeFile * 100) / 100}{' '}
                        MB / Total Size: {Math.round(totalSizeFile * 100) / 100}{' '}
                        MB
                    </Text>
                )}
                <Text fontSize={'sm'} color={'red.600'} fontWeight={'medium'}>
                    File should&apos;t be larger than 1GB!
                </Text>
            </VStack>
            <Button
                as={'label'}
                htmlFor="file"
                colorScheme="pink"
                cursor={'pointer'}
                leftIcon={<AttachmentIcon />}
                disabled={progress !== null || sendingFile || !socket}
                sx={
                    progress !== null || sendingFile || !socket
                        ? { cursor: 'not-allowed' }
                        : {}
                }
                iconSpacing={2}
                onClick={(e) => {
                    if (progress !== null || sendingFile || !socket) {
                        e.preventDefault();
                        return;
                    }
                    if (!currentRoom) {
                        e.preventDefault();
                        toast({
                            title: 'Room not found',
                            status: 'error',
                            duration: 2000,
                            isClosable: true,
                            position: 'top-right',
                        });
                    }
                }}
            >
                {progress !== null ? (
                    <>{progress}%</>
                ) : sendingFile ? (
                    'Sending!'
                ) : (
                    'Send file!'
                )}
            </Button>
            <input
                id="file"
                type="file"
                hidden
                onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !socket || sendingFile) return;
                    const maxFileSizeInBytes = 1024 * 1024 * 1024; // 1GB
                    if (file.size > maxFileSizeInBytes) {
                        toast({
                            title: 'File too large',
                            status: 'error',
                            duration: 2000,
                            isClosable: true,
                            position: 'top-right',
                        });
                        return;
                    }
                    const fileSizeInMb = file.size / (1024 * 1024);
                    setTotalSizeFile(fileSizeInMb);
                    setCurrentSizeFile(0);
                    setSendingFile(true);
                    // send notice that someone hast sent a file
                    socket.emit('send_file', {
                        currentRoom: currentRoom,
                    });
                    await delay(100);
                    const fileReader = new FileReader();
                    fileReader.onload = async () => {
                        if (fileReader.result instanceof ArrayBuffer) {
                            const arrayBuffer = fileReader.result;
                            const chunkSize = 1024 * 512; // 512 KB (Send to server in chunks of 512 KB)
                            const totalChunks = Math.ceil(
                                arrayBuffer.byteLength / chunkSize
                            );
                            for (let i = 0; i < totalChunks; i++) {
                                const start = i * chunkSize;
                                const end = Math.min(
                                    (i + 1) * chunkSize,
                                    arrayBuffer.byteLength
                                );
                                const chunk = arrayBuffer.slice(start, end);
                                // convert chunk to mb
                                const chunkSizeInMB =
                                    chunk.byteLength / (1024 * 1024);
                                await delay(50);
                                socket.emit('upload_chunk', {
                                    chunk,
                                    totalChunks,
                                    currentChunk: i + 1,
                                    name: file.name,
                                    currentRoom: currentRoom,
                                    chunkSizeInMB,
                                    fileSizeInMb,
                                });
                            }
                        }
                    };

                    fileReader.readAsArrayBuffer(file);
                }}
            />
        </VStack>
    );
};

export default SendFileBtn;
