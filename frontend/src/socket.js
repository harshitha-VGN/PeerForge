import { io } from 'socket.io-client';

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const SOCKET_URL = isLocalhost ? 'http://localhost:5001' : 'https://peerforge.onrender.com';

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  withCredentials: true,
  transports: ['websocket', 'polling'],
});

export default socket;
