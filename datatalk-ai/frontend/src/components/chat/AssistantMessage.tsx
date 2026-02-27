import React from 'react';
import { ResponseCard } from '../response/ResponseCard';
import { AuditTrail } from '../audit/AuditTrail';

interface AssistantMessageProps {
    message: {
        content: string;
        responsePayload?: any;
    };
}

export const AssistantMessage: React.FC<AssistantMessageProps> = ({ message }) => {
    if (message.responsePayload) {
        return (
            <div className="flex flex-col gap-5 w-full">
                <ResponseCard payload={message.responsePayload} />
                {message.responsePayload.audit_trail && (
                    <AuditTrail steps={message.responsePayload.audit_trail} />
                )}
            </div>
        );
    }

    return <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>;
};
