import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  ConnectedSocket,
} from '@nestjs/websockets';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import type { Socket, Server } from 'socket.io';
import * as fs from 'fs';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'socket',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly eventsService: EventsService) {}

  handleConnection(client: Socket) {
    console.log('Client connected: ', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected: ', client.id);
  }

  @SubscribeMessage('send_file')
  async sendFile(
    @MessageBody()
    data: {
      currentRoom: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    client.broadcast.to(data.currentRoom).emit('sending_file', true);
  }

  @SubscribeMessage('upload_chunk')
  async uploadFile(
    @MessageBody()
    data: {
      chunk: number;
      totalChunks: number;
      currentChunk: number;
      name: string;
      currentRoom: string;
      chunkSizeInMB: number;
      fileSizeInMb: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    if (data.currentChunk === data.totalChunks) {
      this.server.to(data.currentRoom).emit('progress', {
        progress: 100,
        chunkSizeInMB: data.chunkSizeInMB,
        fileSizeInMb: data.fileSizeInMb,
      });
      client.broadcast.to(data.currentRoom).emit('upload_progress', {
        progress: 100,
        chunk: data.chunk,
        isLast: true,
        name: data.name,
      });
    } else {
      const progress = (data.currentChunk / data.totalChunks) * 100;
      this.server.to(data.currentRoom).emit('progress', {
        progress,
        chunkSizeInMB: data.chunkSizeInMB,
        fileSizeInMb: data.fileSizeInMb,
      });
      client.broadcast.to(data.currentRoom).emit('upload_progress', {
        progress,
        chunk: data.chunk,
        isLast: false,
        name: data.name,
      });
    }
  }

  @SubscribeMessage('join_room')
  async joinRoom(
    @MessageBody()
    { currentRoom, newRoom }: { currentRoom: string; newRoom: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(currentRoom);
    client.join(newRoom);
    return {
      event: 'join_room_success',
      data: newRoom,
    };
  }

  @SubscribeMessage('test_room')
  async testRoom(
    @MessageBody()
    { currentRoom }: { currentRoom: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.broadcast.to(currentRoom).emit('test_room_success', 'Hello');
  }
}
