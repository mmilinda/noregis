import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'https://noregisbackend-h9l7.onrender.com').replace(/\/+$/, '');

let socket = null;

/**
 * Connecte le socket au backend et enregistre les listeners d'evenements.
 * @param {Function} dispatch - dispatch du contexte React
 */
export function connectSocket(dispatch) {
  if (socket?.connected) return;

  socket = io(SOCKET_URL, {
    transports: ['polling', 'websocket'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('Socket.IO connecte :', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket.IO deconnecte');
  });

  // Nouvelle visite enregistree en temps reel
  socket.on('visite:entree', (visite) => {
    dispatch({ type: 'ADD_VISIT_REALTIME', payload: visite });
  });

  // Sortie enregistree en temps reel
  socket.on('visite:sortie', (visite) => {
    dispatch({ type: 'UPDATE_VISIT_REALTIME', payload: visite });
  });

  // Visite supprimee en temps reel
  socket.on('visite:supprimee', ({ id }) => {
    dispatch({ type: 'DELETE_VISIT', payload: id });
  });
}

/**
 * Deconnecte le socket proprement (a appeler au logout).
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
