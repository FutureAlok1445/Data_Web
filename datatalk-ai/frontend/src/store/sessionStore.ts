import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SessionState {
    sessionId: string | null;
    datasetName: string | null;
    schema: Record<string, any> | null;
    dataDictionary: any | null;
    impactScores: any[] | null;
    targetColumn: string | null;
    setSession: (id: string, name: string, schema: Record<string, any>, dictionary?: any, impactScores?: any[], targetColumn?: string) => void;
    clearSession: () => void;
}

export const useSessionStore = create<SessionState>()(
    persist(
        (set) => ({
            sessionId: null,
            datasetName: null,
            schema: null,
            dataDictionary: null,
            impactScores: null,
            targetColumn: null,
            setSession: (id, name, schema, dictionary, impactScores, targetColumn) =>
                set({
                    sessionId: id,
                    datasetName: name,
                    schema,
                    dataDictionary: dictionary || null,
                    impactScores: impactScores || null,
                    targetColumn: targetColumn || null,
                }),
            clearSession: () =>
                set({ sessionId: null, datasetName: null, schema: null, dataDictionary: null, impactScores: null, targetColumn: null }),
        }),
        {
            name: 'datatalk-session', // localStorage key
        }
    )
);
