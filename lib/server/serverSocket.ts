import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getServerSocket = async () => {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    socket = io(socketUrl, {
      path: '/api/socket',
      withCredentials: true
    });

    socket.on('connect_error', (error) => {
      console.error('Server socket connection error:', error);
      socket = null;
    });
  }
  return socket;
};
