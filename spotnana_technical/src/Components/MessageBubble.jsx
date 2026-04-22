// Simple message bubble
export default function MessageBubble({ message }) {
    const isUser = message.role === 'user';
    return (
        <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
            {!isUser && <div className="avatar avatar-xs" />}
            <div className={`bubble ${isUser ? 'bubble-user' : 'bubble-assistant'}`}>
                {message.content}
            </div>
        </div>
    );
}
