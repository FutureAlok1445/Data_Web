import { create } from 'zustand';

interface SessionState {
    sessionId: string | null;
    datasetName: string | null;
    schema: Record<string, string> | null;
    dataDictionary: string | null;
    setSession: (id: string, name: string, schema: Record<string, string>, dictionary?: string) => void;
    clearSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
    sessionId: null,
    datasetName: null,
    schema: null,
    dataDictionary: null,
    setSession: (id, name, schema, dictionary) =>
        set({ sessionId: id, datasetName: name, schema, dataDictionary: dictionary || null }),
    clearSession: () =>
        set({ sessionId: null, datasetName: null, schema: null, dataDictionary: null }),
}));
