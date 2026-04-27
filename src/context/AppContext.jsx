import { useReducer, useCallback } from 'react';
import { AppContext, initialState, reducer } from './useAppState';

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const notify = useCallback((type, message, duration = 3500) => {
    dispatch({ type: 'SET_NOTIFICATION', payload: { type, message } });
    setTimeout(() => dispatch({ type: 'CLEAR_NOTIFICATION' }), duration);
  }, []);

  const value = { state, dispatch, notify };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
