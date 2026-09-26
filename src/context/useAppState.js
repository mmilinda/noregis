import { createContext, useContext } from 'react';
import { MOCK_VISITORS, AGENT_PROFILE } from '../data/mockData';

// ============================================================
//  App Context & State Management Core
// ============================================================

export const AppContext = createContext(null);

const storedToken = localStorage.getItem('token');
const storedUser = localStorage.getItem('user');
const storedSettings = localStorage.getItem('noregis_settings');
const storedNotifs = localStorage.getItem('noregis_notifications');
const storedDarkMode = localStorage.getItem('noregis_darkmode');

let parsedUser = null;
try {
  if (storedUser) parsedUser = JSON.parse(storedUser);
} catch (e) {
  console.error("Erreur parsing user", e);
}

let parsedSettings = { language: 'fr', soundAlerts: true, autoSync: true, offlineMode: false, fontSize: 'medium' };
try {
  if (storedSettings) parsedSettings = { ...parsedSettings, ...JSON.parse(storedSettings) };
} catch (e) {}

let parsedNotifs = { newVisits: true, reminders: false, email: false, push: true, sounds: true };
try {
  if (storedNotifs) parsedNotifs = { ...parsedNotifs, ...JSON.parse(storedNotifs) };
} catch (e) {}

export const initialState = {
  activeTab: 'dashboard',
  darkMode: storedDarkMode ? JSON.parse(storedDarkMode) : false,
  visitors: [], // Commence vide, chargé via Dashboard
  currentVisitor: null,
  notification: null, 
  scanMode: null,     
  isAuthenticated: !!storedToken,
  agent: parsedUser ? {
    id: parsedUser._id || parsedUser.id,
    ...parsedUser,
    initials: (parsedUser.prenom?.[0] || 'A') + (parsedUser.nom?.[0] || 'U')
  } : AGENT_PROFILE,
  searchQuery: '',
  filterStatus: 'all',
  filterDate: new Date().toLocaleDateString('fr-FR'),
  settings: parsedSettings,
  notifications: parsedNotifs,
};

export function reducer(state, action) {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.payload };
    case 'TOGGLE_DARK': {
      const nextDark = !state.darkMode;
      localStorage.setItem('noregis_darkmode', JSON.stringify(nextDark));
      return { ...state, darkMode: nextDark };
    }
    case 'ADD_VISITOR': {
      if (!action.payload) return state;
      const newVis = action.payload;
      const newId = newVis._id || newVis.id;
      const exists = state.visitors.some(
        v => (v._id && v._id === newId) || (v.id && v.id === newId)
      );
      if (exists) {
        return {
          ...state,
          visitors: state.visitors.map(v => (v._id === newId || v.id === newId) ? { ...v, ...newVis } : v),
          currentVisitor: newVis,
        };
      }
      return { ...state, visitors: [newVis, ...state.visitors], currentVisitor: newVis };
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
    case 'UPDATE_SETTING': {
      const nextSettings = { ...state.settings, [action.key]: action.value };
      localStorage.setItem('noregis_settings', JSON.stringify(nextSettings));
      return { ...state, settings: nextSettings };
    }
    case 'UPDATE_NOTIFICATION_PREF': {
      const nextNotifs = { ...state.notifications, [action.key]: action.value };
      localStorage.setItem('noregis_notifications', JSON.stringify(nextNotifs));
      return { ...state, notifications: nextNotifs };
    }
    case 'UPDATE_AGENT': {
      const nextAgent = { ...state.agent, ...action.payload };
      if (nextAgent.prenom || nextAgent.nom) {
        nextAgent.initials = ((nextAgent.prenom?.[0] || 'A') + (nextAgent.nom?.[0] || 'U')).toUpperCase();
      }
      localStorage.setItem('user', JSON.stringify(nextAgent));
      return { ...state, agent: nextAgent };
    }
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
        agent: user ? {
          id: user._id || user.id,
          ...user,
          initials: (user.prenom?.[0] || 'A') + (user.nom?.[0] || 'U')
        } : null 
      };
    }
    case 'LOGOUT':
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return { ...state, isAuthenticated: false, agent: null };

    // ── Backend v2 — Suppressions ──────────────────────────────
    case 'DELETE_VISIT':
      return {
        ...state,
        visitors: state.visitors.filter(v =>
          v._id !== action.payload && v.id !== action.payload
        ),
      };
    case 'DELETE_VISITOR':
      return {
        ...state,
        visitors: state.visitors.filter(v => {
          const vid = v.visiteurId?._id || v.visiteurId || v.visiteur?._id;
          return vid !== action.payload;
        }),
      };

    // ── Backend v2 — Socket.IO temps réel ─────────────────────
    case 'ADD_VISIT_REALTIME': {
      if (!action.payload) return state;
      const newVis = action.payload;
      const newId = newVis._id || newVis.id;
      const exists = state.visitors.some(
        v => (v._id && v._id === newId) || (v.id && v.id === newId)
      );
      if (exists) {
        return {
          ...state,
          visitors: state.visitors.map(v => (v._id === newId || v.id === newId) ? { ...v, ...newVis } : v),
          currentVisitor: newVis,
        };
      }
      return { ...state, visitors: [newVis, ...state.visitors], currentVisitor: newVis };
    }
    case 'UPDATE_VISIT_REALTIME': {
      const updated = state.visitors.map(v =>
        (v._id === action.payload._id || v.id === action.payload._id)
          ? { ...v, ...action.payload }
          : v
      );
      return { ...state, visitors: updated };
    }

    default:
      return state;
  }
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
