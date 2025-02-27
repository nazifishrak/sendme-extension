import { ShareSession } from "./types";

export const globalSessions = {
  sessions: [] as ShareSession[],
  listeners: new Set<() => void>(),

  addSession(session: ShareSession) {
    if (this.sessions.some(s => s.id === session.id)) return;
    this.sessions.push(session);
    this.notifyListeners();
  },

  removeSession(id: string) {
    this.sessions = this.sessions.filter((s) => s.id !== id);
    this.notifyListeners();
  },

  getSessions() {
    return [...this.sessions];
  },

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  },

  notifyListeners() {
    this.listeners.forEach((listener) => listener());
  },
};
