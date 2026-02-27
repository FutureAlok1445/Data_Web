import { useCallback } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { apiClient } from '../api/client';

export function useExport() {
    const sessionId = useSessionStore(state => state.sessionId);

    const exportCsv = useCallback(() => {
        if (!sessionId) return;
        window.open(apiClient.exportUrls.csv(sessionId), '_blank');
    }, [sessionId]);

    const exportJson = useCallback(() => {
        if (!sessionId) return;
        window.open(apiClient.exportUrls.json(sessionId), '_blank');
    }, [sessionId]);

    const exportSql = useCallback(() => {
        if (!sessionId) return;
        window.open(apiClient.exportUrls.sql(sessionId), '_blank');
    }, [sessionId]);

    const exportPdf = useCallback(() => {
        if (!sessionId) return;
        window.open(apiClient.exportUrls.pdf(sessionId), '_blank');
    }, [sessionId]);

    return { exportCsv, exportJson, exportSql, exportPdf, hasSession: !!sessionId };
}
