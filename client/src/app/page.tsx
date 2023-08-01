'use client';

import GenerateRoomCode from '@/components/GenerateRoomCode';
import SendFileBtn from '@/components/SendFileBtn';
import {
    Box,
    Container,
    VStack,
    Card,
    CardHeader,
    Heading,
    HStack,
    Text,
    CardBody,
    Divider,
    Tooltip,
} from '@chakra-ui/react';

export default function Home() {
    return (
        <VStack
            sx={{
                bgImage: 'url(./bg.svg)',
                bgRepeat: 'no-repeat',
                bgSize: 'auto',
            }}
        >
            <Container centerContent minH={'100vh'} w={'100%'}>
                <Box m={'auto'}>
                    <Card
                        border={'2px'}
                        borderColor={'red.300'}
                        borderRadius={'3xl'}
                        w={'100%'}
                        maxW={'400px'}
                    >
                        <CardHeader
                            backgroundColor={'blackAlpha.200'}
                            borderTopRadius={'3xl'}
                            bgGradient={
                                'linear-gradient(111.68deg, rgb(242, 236, 242) 0%, rgb(232, 242, 246) 100%)'
                            }
                        >
                            <Heading
                                as={'h1'}
                                size={'md'}
                                color={'blue.900'}
                                fontWeight={'semibold'}
                                mb={'3'}
                            >
                                Unleash the Power of Connectivity! Anytime,
                                Anywhere.
                            </Heading>
                            <HStack spacing={'1'}>
                                <Text fontSize={'sm'}>
                                    Transcending boundaries with
                                </Text>
                                <Text
                                    fontSize={'sm'}
                                    fontWeight={'semibold'}
                                    color={'red.500'}
                                >
                                    BanhTheCake
                                </Text>
                            </HStack>
                        </CardHeader>
                        <CardBody>
                            <VStack spacing={'3'} alignItems={'start'}>
                                <GenerateRoomCode />
                                <Divider
                                    borderColor={'blackAlpha.600'}
                                    mt={2}
                                    sx={{
                                        borderWidth: '1.2px',
                                    }}
                                />
                                <SendFileBtn />
                                <Text>Or paste directly from Clipboard!</Text>
                                <Tooltip
                                    label="Rest easy! Your files travel securely, moving straight from your device to the recipient. We don’t store any data on our servers."
                                    hasArrow
                                    placement="top"
                                    p={4}
                                    borderRadius={'md'}
                                >
                                    <Text
                                        fontSize={'sm'}
                                        fontWeight={'bold'}
                                        color={'blue.600'}
                                        _hover={{
                                            textDecoration: 'underline',
                                        }}
                                    >
                                        Curious about your file&lsquo;s journey?
                                    </Text>
                                </Tooltip>
                            </VStack>
                        </CardBody>
                    </Card>
                </Box>
            </Container>
        </VStack>
    );
}
