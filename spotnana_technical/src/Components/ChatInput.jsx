import { useState, useRef, useEffect } from 'react';

// Globals
// This value must match the backend's value for MAX_LENGTH
const MAX_LENGTH = 500;

// This is for a visual indication that the user is about to hit max character limit
// We'll set this to 90% which means the user should only see this at 450 characters.
const COUNTER_THRESHOLD = MAX_LENGTH * 0.9;

// Max height of the input box. I set it arbitrarily to 180 px.
const MAX_TEXTAREA_HEIGHT = 180;

// ChatInput Component
export default function ChatInput({ onSend, disabled }) {
    const [value, setValue] = useState('');
    const textareaRef = useRef(null);

    const submit = () => {
        const trimmed = value.trim();
        // This part is here in case the user tries to copy paste in a block bigger than the limit
        if (!trimmed || disabled || trimmed.length > MAX_LENGTH) return;
        onSend(trimmed);
        setValue('');
    };

    const handleKeyDown = (e) => {
        // Enter to send, Shift+Enter for newline
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    };

    // For the auto-resizing of the input box
    // Reset to auto first to avoid the current height being the floor
    // ScrollHeight = total height the content wants to be
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
    }, [value]);

    // For character limit management
    const showCounter = value.length >= COUNTER_THRESHOLD;
    const remaining = MAX_LENGTH - value.length;
    const overLimit = remaining < 0;

    return (
        <form
            className="chat-input"
            onSubmit={(e) => {
                e.preventDefault();
                submit();
            }}
        >
            {/* Input Section */}
            <div className="input-wrap">
                <textarea
                    ref={textareaRef}
                    placeholder="Type a message"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    maxLength={MAX_LENGTH}
                    rows={1}
                    autoFocus
                />
                {showCounter && (
                    <span className={`char-counter ${overLimit ? 'over' : ''}`}>
                        {remaining}
                    </span>
                )}
            </div>
            {/* Disable send button if we are over the character limit */}
            <button
                type="submit"
                className="send-btn"
                disabled={disabled || !value.trim() || overLimit}
                aria-label="Send message"
            >
                {/* Magic SVG. I used AI to generate this one since most models are really good at generating icons. */}
                {/* If no AI is preferred, of course you can always grab an icon off FontAwesome. */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8L14 2L8 14L6.5 9.5L2 8Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
            </button>
        </form>
    );
}
