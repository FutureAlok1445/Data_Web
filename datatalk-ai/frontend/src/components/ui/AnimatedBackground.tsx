import React from 'react';

export default function AnimatedBackground() {
    return (
        <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-[-1] bg-background transition-colors duration-500">
            {/* Top Left Blob */}
            <div
                className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full filter blur-[100px] opacity-60 animate-blob"
            />
            {/* Top Right Blob */}
            <div
                className="absolute top-[10%] right-[-5%] w-96 h-96 bg-purple-500/15 rounded-full filter blur-[100px] opacity-60 animate-blob"
                style={{ animationDelay: '2s' }}
            />
            {/* Bottom Center Blob */}
            <div
                className="absolute bottom-[-10%] left-[20%] w-[40rem] h-[30rem] bg-blue-500/15 rounded-full filter blur-[120px] opacity-60 animate-blob"
                style={{ animationDelay: '4s' }}
            />
        </div>
    );
}
