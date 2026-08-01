import { useState, useCallback } from 'react';

export const useSettingsHistory = (initialSettings) => {
  const [state, setState] = useState({
    history: [initialSettings || {}],
    currentIndex: 0
  });

  const { history, currentIndex } = state;
  const draftSettings = history[currentIndex];
  const isDirty = currentIndex > 0 || (history.length > 1 && JSON.stringify(history[currentIndex]) !== JSON.stringify(initialSettings));
  
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const handleUpdateDraft = useCallback((partialUpdate) => {
    setState((prevState) => {
      const { history: prevHistory, currentIndex: prevIndex } = prevState;
      const current = prevHistory[prevIndex];
      const nextState = { ...current, ...partialUpdate };
      
      // If nothing changed, don't add to history
      if (JSON.stringify(current) === JSON.stringify(nextState)) {
        return prevState;
      }

      // Slice the history to remove any "future" redo states
      const newHistory = prevHistory.slice(0, prevIndex + 1);
      newHistory.push(nextState);
      
      // Keep max 50 states to prevent memory leaks
      let nextIndex = prevIndex + 1;
      if (newHistory.length > 50) {
        newHistory.shift();
        nextIndex = newHistory.length - 1;
      }

      return {
        history: newHistory,
        currentIndex: nextIndex
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState((prevState) => {
      if (prevState.currentIndex > 0) {
        return { ...prevState, currentIndex: prevState.currentIndex - 1 };
      }
      return prevState;
    });
  }, []);

  const redo = useCallback(() => {
    setState((prevState) => {
      if (prevState.currentIndex < prevState.history.length - 1) {
        return { ...prevState, currentIndex: prevState.currentIndex + 1 };
      }
      return prevState;
    });
  }, []);

  const reset = useCallback((newInitialSettings) => {
    setState({
      history: [newInitialSettings || {}],
      currentIndex: 0
    });
  }, []);

  return {
    draftSettings,
    isDirty,
    handleUpdateDraft,
    undo,
    redo,
    canUndo,
    canRedo,
    reset
  };
};
