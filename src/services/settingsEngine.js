import * as dbEngine from './dbEngine.js';
import {  saveSettings as dbSaveSettings  } from './dbEngine.js';

class SettingsEngine {
  constructor() {
    this.drafts = new Map();
    this.history = new Map();
    this.historyIndex = new Map();
  }

  // Gets settings (draft if exists, otherwise from dbEngine)
  async getSettings(workspaceId, settingsKey = 'businessProfile') {
    if (this.drafts.has(workspaceId) && this.drafts.get(workspaceId)[settingsKey]) {
      return this.drafts.get(workspaceId)[settingsKey];
    }
    // Fallback to dbEngine
    const settings = await dbEngine.getSettings(workspaceId);
    return settings || {};
  }

  // Update draft (dirty state)
  updateDraft(workspaceId, settingsKey = 'businessProfile', newData) {
    if (!this.drafts.has(workspaceId)) {
      this.drafts.set(workspaceId, {});
    }
    
    const workspaceDrafts = this.drafts.get(workspaceId);
    const currentData = workspaceDrafts[settingsKey] || {};
    
    // Save to history before mutating
    this._pushHistory(workspaceId, settingsKey, currentData);
    
    const updatedData = { ...currentData, ...newData };
    workspaceDrafts[settingsKey] = updatedData;
    
    return updatedData;
  }

  // Check if there are unsaved changes
  isDirty(workspaceId, settingsKey = 'businessProfile') {
    return this.drafts.has(workspaceId) && this.drafts.get(workspaceId)[settingsKey] !== undefined;
  }

  // Publish changes to database via dbEngine
  async publish(workspaceId, settingsKey = 'businessProfile') {
    if (!this.isDirty(workspaceId, settingsKey)) return true;
    
    const draftData = this.drafts.get(workspaceId)[settingsKey];
    
    // Update dbEngine
    await dbEngine.saveSettings(draftData);
    
    // Clear draft and history for this key after successful publish
    this.drafts.get(workspaceId)[settingsKey] = null;
    this._clearHistory(workspaceId, settingsKey);
    return true;
  }

  // Discard dirty state
  discard(workspaceId, settingsKey = 'businessProfile') {
    if (this.drafts.has(workspaceId)) {
      this.drafts.get(workspaceId)[settingsKey] = null;
    }
    this._clearHistory(workspaceId, settingsKey);
  }

  // Undo last draft change
  undo(workspaceId, settingsKey = 'businessProfile') {
    const historyState = this._popHistory(workspaceId, settingsKey, -1);
    if (historyState) {
      if (!this.drafts.has(workspaceId)) this.drafts.set(workspaceId, {});
      this.drafts.get(workspaceId)[settingsKey] = historyState;
      return historyState;
    }
    return null;
  }
  
  // Redo draft change (simple implementation)
  redo(workspaceId, settingsKey = 'businessProfile') {
    const historyState = this._popHistory(workspaceId, settingsKey, 1);
    if (historyState) {
      if (!this.drafts.has(workspaceId)) this.drafts.set(workspaceId, {});
      this.drafts.get(workspaceId)[settingsKey] = historyState;
      return historyState;
    }
    return null;
  }

  // Internal history management for undo/redo
  _pushHistory(workspaceId, settingsKey, data) {
    const key = `${workspaceId}_${settingsKey}`;
    if (!this.history.has(key)) {
      this.history.set(key, []);
      this.historyIndex.set(key, -1);
    }
    
    const hist = this.history.get(key);
    let idx = this.historyIndex.get(key);
    
    // If we are pushing a new state while not at the end of history, truncate future history
    if (idx < hist.length - 1) {
      hist.splice(idx + 1);
    }
    
    hist.push(JSON.parse(JSON.stringify(data))); // deep copy
    this.historyIndex.set(key, hist.length - 1);
  }

  _popHistory(workspaceId, settingsKey, direction) {
    const key = `${workspaceId}_${settingsKey}`;
    if (!this.history.has(key)) return null;
    
    const hist = this.history.get(key);
    let idx = this.historyIndex.get(key);
    
    const newIdx = idx + direction;
    if (newIdx >= 0 && newIdx < hist.length) {
      this.historyIndex.set(key, newIdx);
      return JSON.parse(JSON.stringify(hist[newIdx]));
    }
    return null;
  }
  
  _clearHistory(workspaceId, settingsKey) {
    const key = `${workspaceId}_${settingsKey}`;
    this.history.delete(key);
    this.historyIndex.delete(key);
  }

  async saveSettings(settingsData) {
    return await dbSaveSettings(settingsData);
  }
}

export const settingsEngine = new SettingsEngine();
