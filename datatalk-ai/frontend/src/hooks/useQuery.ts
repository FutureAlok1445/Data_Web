import { useCallback, useState } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { useChatStore } from '../store/chatStore';
import { apiClient } from '../api/client';

export function useQuery() {
    const sessionId = useSessionStore(state => state.sessionId);
    const addMessage = useChatStore(state => state.addMessage);
    const setLoading = useChatStore(state => state.setLoading);
    const [error, setError] = useState<string | null>(null);

    const sendQuery = useCallback(async (query: string) => {
        if (!query.trim() || !sessionId) return;

        setError(null);
        const userMsg = { id: Date.now().toString(), role: 'user' as const, content: query };
        addMessage(userMsg);
        setLoading(true);

        try {
            const response = await apiClient.processQuery(sessionId, query);
            addMessage({
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.answer,
                responsePayload: response
            });
        } catch (err: any) {
            const errorMsg = err.message || 'Error executing AI pipeline.';
            setError(errorMsg);
            addMessage({
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: errorMsg,
                isError: true
            });
        } finally {
            setLoading(false);
        }
    }, [sessionId, addMessage, setLoading]);

    return { sendQuery, error };
}
