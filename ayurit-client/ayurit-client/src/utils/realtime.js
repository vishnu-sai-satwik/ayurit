import { io } from 'socket.io-client';
import { resolveApiBaseUrl } from './api';
import { getAccessToken } from './session';

let socketInstance = null;

const resolveSocketBaseUrl = async () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL.replace(/\/$/, '');
  }

  const apiBase = await resolveApiBaseUrl();

  if (typeof apiBase === 'string' && apiBase.startsWith('http')) {
    return apiBase.replace(/\/api\/?$/, '');
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
};

export const getRealtimeSocket = async () => {
  const socketBaseUrl = await resolveSocketBaseUrl();

  if (!socketInstance) {
    socketInstance = io(socketBaseUrl, {
      path: '/socket.io',
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: {
        token: getAccessToken()
      }
    });
  }

  socketInstance.auth = {
    token: getAccessToken()
  };

  if (!socketInstance.connected) {
    socketInstance.connect();
  }

  return socketInstance;
};

export const disconnectRealtimeSocket = () => {
  if (!socketInstance) return;
  socketInstance.removeAllListeners();
  socketInstance.disconnect();
  socketInstance = null;
};