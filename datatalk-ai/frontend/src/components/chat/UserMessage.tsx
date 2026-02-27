import React from 'react';

interface UserMessageProps {
    content: string;
}

export const UserMessage: React.FC<UserMessageProps> = ({ content }) => {
    return (
        <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{content}</p>
    );
};
