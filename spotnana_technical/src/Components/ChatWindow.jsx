import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

// Component for the actual chat region
export default function ChatWindow({ messages, loading, error, historyLoaded, onDismissError }) {
    // For marking the end of the window
    const endRef = useRef(null);

    // For the animation to scroll to the bottom on any changes to the chat
    // Can be modified if you want different behavior, but for the sake of example
    // this is a common pattern.
    // The ternary is here in case endRef loads before React mounts the DOM
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    // Must be run before anything. Detects if we can even connect to the backend to get 
    // chat history. If not then immediately throw an error.
    if (!historyLoaded && error) {
        return (
            <div className="chat-window empty">
                <div className="empty-state">
                    <p className="empty-title">{error.message}</p>
                    {error.retry && (
                        <button className="retry-btn" onClick={error.retry}>
                            Try again
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Default chat window when now messages are listed
    const showEmpty = messages.length === 0 && !loading && !error;

    if (showEmpty) {
        return (
            <div className="chat-window empty">
                <div className="empty-state">
                    <p className="empty-title">Hello! What can I help you with today?</p>
                    <p className="empty-sub">Ask anything to get started.</p>
                </div>
            </div>
        );
    }

    // JSX 
    return (
        <div className="chat-window">
            {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* Typing animation conditional render */}
            {loading && (
                <div className="message-row assistant">
                    <div className="avatar avatar-xs" />
                    <div className="bubble bubble-assistant typing">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            )}

            {/* Retry or dismiss buttons for the user when an error occurs */}
            {error && (
                <div className="error-banner" role="alert">
                    <span className="error-text">{error.message}</span>
                    <div className="error-actions">
                        {error.retry && (
                            <button className="error-btn" onClick={error.retry}>
                                Retry
                            </button>
                        )}
                        <button className="error-btn error-btn-dismiss" onClick={onDismissError} aria-label="Dismiss">
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Here so that we don't need to do containerRef.current.scrollTop = containerRef.current.scrollHeight 
            and manually compute scroll positions and whatnot.*/}
            <div ref={endRef} />
        </div>
    );
}
