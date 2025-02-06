'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket;
let initializationPromise: Promise<Socket> | null = null;

export const initSocketClient = async () => {
  if (!socket && !initializationPromise) {
    initializationPromise = new Promise(async (resolve, reject) => {
      try {
        // Fetch refresh token from our API endpoint
        const response = await fetch('/api/auth/token');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to get refresh token');
        }

        console.log("🚀 ~ refreshToken:", data.refreshToken);

        socket = io({
          path: '/api/socket',
          addTrailingSlash: false,
          auth: {
            refreshToken: data.refreshToken
          }
        });

        socket.on('connect', () => {
          resolve(socket);
        });

        socket.on('connect_error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
        initializationPromise = null;
      }
    });
  }

  return initializationPromise ? await initializationPromise : socket;
};

export const getSocket = async () => {
  console.log("🚀 ~ file: socketClient.ts:52 ~ socket:", socket)
  if (!socket) {
    return await initSocketClient();
  }
  return socket;
};
