import { createContext, useContext } from 'react';
import { MOCK_VISITORS, AGENT_PROFILE } from '../data/mockData';

// ============================================================
//  App Context & State Management Core
// ============================================================

export const AppContext = createContext(null);

const storedToken = localStorage.getItem('token');
const storedUser = localStorage.getItem('user');
let parsedUser = null;
try {
  if (storedUser) parsedUser = JSON.parse(storedUser);
} catch (e) {
  console.error("Erreur parsing user", e);
}

export const initialState = {
  activeTab: 'dashboard',
  darkMode: false,
  visitors: [], // Commence vide, chargé via Dashboard
  currentVisitor: null,
  notification: null, 
  scanMode: null,     
  isAuthenticated: !!storedToken,
  agent: parsedUser ? {
    ...AGENT_PROFILE,
    ...parsedUser,
    initials: (parsedUser.prenom?.[0] || 'A') + (parsedUser.nom?.[0] || 'U')
  } : AGENT_PROFILE,
  searchQuery: '',
  filterStatus: 'all',
  filterDate: new Date().toLocaleDateString('fr-FR'),
  settings: {
    language: 'fr',
    soundAlerts: true,
    autoSync: true,
    offlineMode: false,
    fontSize: 'medium',
  },
  notifications: {
    newVisits: true,
    reminders: false,
    email: false,
    push: true,
    sounds: true,
  },
};

export function reducer(state, action) {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.payload };
    case 'TOGGLE_DARK':
      return { ...state, darkMode: !state.darkMode };
    case 'ADD_VISITOR': {
      const now = new Date();
      const visitor = { 
        ...action.payload, 
        id: `VIS-${now.getFullYear()}-${Date.now().toString().slice(-6)}` 
      };
      return { ...state, visitors: [visitor, ...state.visitors], currentVisitor: visitor };
    }
    case 'CHECKOUT_VISITOR': {
      const now = new Date();
      const checkoutTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const updated = state.visitors.map(v =>
        (v.id === action.payload || v._id === action.payload)
          ? { ...v, statut: 'sorti', heureSortie: checkoutTime }
          : v
      );
      return { ...state, visitors: updated };
    }
    case 'SET_CURRENT_VISITOR':
      return { ...state, currentVisitor: action.payload };
    case 'SET_NOTIFICATION':
      return { ...state, notification: action.payload };
    case 'CLEAR_NOTIFICATION':
      return { ...state, notification: null };
    case 'SET_SCAN_MODE':
      return { ...state, scanMode: action.payload };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    case 'SET_FILTER_STATUS':
      return { ...state, filterStatus: action.payload };
    case 'SET_FILTER_DATE':
      return { ...state, filterDate: action.payload };
    case 'UPDATE_SETTING':
      return { ...state, settings: { ...state.settings, [action.key]: action.value } };
    case 'UPDATE_NOTIFICATION_PREF':
      return { ...state, notifications: { ...state.notifications, [action.key]: action.value } };
    case 'UPDATE_AGENT':
      return { ...state, agent: { ...state.agent, ...action.payload } };
    case 'SET_VISITORS':
      return { ...state, visitors: action.payload };
    case 'LOGIN': {
      const user = action.payload.user || action.payload;
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      return { 
        ...state, 
        isAuthenticated: true, 
        agent: {
          ...AGENT_PROFILE,
          ...action.payload,
          ...(action.payload.user || {})
        } 
      };
    }
    case 'LOGOUT':
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return { ...state, isAuthenticated: false, agent: null };
    default:
      return state;
  }
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
