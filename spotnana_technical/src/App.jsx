import { useState, useEffect, useCallback, useRef } from 'react';
import { sendMessage, fetchHistory, clearHistory, errorMessage } from './Utilities/Api';
import Header from './Components/Header';
import ChatWindow from './Components/ChatWindow';
import ChatInput from './Components/ChatInput';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Counter for optimistic IDs. useRef keeps the value stable
  // across renders without triggering re-renders, and incrementing it is a
  // pure operation from React's perspective (unlike Date.now()).
  const tempIdCounter = useRef(0);

  // Simply calls the API code to load the chat history
  const loadHistory = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchHistory();
      setMessages(data.messages);
      setHistoryLoaded(true);
    } catch (err) {
      setError({
        message: errorMessage(err),
        retry: loadHistory,
      });
    }
  }, []);

  // Load chat history on component mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSend = async (prompt) => {
    setError(null);
    setLoading(true);

    // This temp ID is for preloading the messages aka optimistic loading
    // We'll show the user's message on the screen first before the API call
    // finishes which makes it a bit better of a user experience.
    const tempId = `temp-${tempIdCounter.current++}`;
    const optimisticMsg = {
      id: tempId,
      role: 'user',
      content: prompt,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    // API call to send message to API
    try {
      const { user_message, assistant_message } = await sendMessage(prompt);
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempId);
        return [...withoutTemp, user_message, assistant_message];
      });
    } catch (err) {
      // If we hit this, something went wrong so we roll back the message and display
      // the error message instead. There's also a retry feature here where the user can retry the send
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError({
        message: errorMessage(err),
        retry: () => handleSend(prompt),
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear messages button
  const handleClear = async () => {
    if (!window.confirm('Clear all messages? This cannot be undone.')) return;
    try {
      await clearHistory();
      setMessages([]);
      setError(null);
    } catch (err) {
      setError({
        message: errorMessage(err),
        retry: handleClear,
      });
    }
  };

  // Dismiss error button handler
  const dismissError = () => setError(null);

  // JSX output
  return (
    <div className="app">
      <div className="chat-container">
        <Header onClear={handleClear} canClear={messages.length > 0} />
        <ChatWindow
          messages={messages}
          loading={loading}
          error={error}
          historyLoaded={historyLoaded}
          onDismissError={dismissError}
        />
        <ChatInput onSend={handleSend} disabled={loading} />
      </div>
    </div>
  );
}
