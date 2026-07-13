import { useState, useCallback } from 'react';

export const useSettingsHistory = (initialSettings) => {
  const [history, setHistory] = useState([initialSettings || {}]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const draftSettings = history[currentIndex];
  const isDirty = currentIndex > 0 || (history.length > 1 && JSON.stringify(history[currentIndex]) !== JSON.stringify(initialSettings));
  
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const handleUpdateDraft = useCallback((partialUpdate) => {
    setHistory((prevHistory) => {
      const current = prevHistory[currentIndex];
      const nextState = { ...current, ...partialUpdate };
      
      // If nothing changed, don't add to history
      if (JSON.stringify(current) === JSON.stringify(nextState)) {
        return prevHistory;
      }

      // Slice the history to remove any "future" redo states
      const newHistory = prevHistory.slice(0, currentIndex + 1);
      newHistory.push(nextState);
      
      // Keep max 50 states to prevent memory leaks
      if (newHistory.length > 50) {
        newHistory.shift();
        setCurrentIndex(newHistory.length - 1);
        return newHistory;
      }

      return newHistory;
    });
    setCurrentIndex((prev) => Math.min(prev + 1, 50));
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [canRedo]);

  const reset = useCallback((newInitialSettings) => {
    setHistory([newInitialSettings || {}]);
    setCurrentIndex(0);
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
