import { createContext, useContext } from 'react';
import { MOCK_VISITORS, AGENT_PROFILE } from '../data/mockData';

// ============================================================
//  App Context & State Management Core
// ============================================================

export const AppContext = createContext(null);

export const initialState = {
  activeTab: 'dashboard',
  darkMode: false,
  visitors: MOCK_VISITORS,
  currentVisitor: null,
  notification: null, // { type: 'success'|'error'|'info', message: string }
  scanMode: null,     // null | 'person' | 'vehicule'
  isAuthenticated: false,
  agent: AGENT_PROFILE,
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
      const visitor = { ...action.payload, id: `VIS-2026-${String(state.visitors.length + 1).padStart(3, '0')}` };
      return { ...state, visitors: [visitor, ...state.visitors], currentVisitor: visitor };
    }
    case 'CHECKOUT_VISITOR': {
      const now = new Date();
      const updated = state.visitors.map(v =>
        v.id === action.payload
          ? { ...v, statut: 'sorti', heureSortie: now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }
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
    case 'LOGIN':
      return { ...state, isAuthenticated: true, agent: action.payload };
    case 'LOGOUT':
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
