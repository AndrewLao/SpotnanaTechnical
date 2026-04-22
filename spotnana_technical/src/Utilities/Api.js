// Fetch wrapper so we don't have to copy paste code around

const API_BASE = '/api';
const REQUEST_TIMEOUT_MS = 30_000; // In case the LLM takes too long

// Custom error class 
export class ApiError extends Error {
    constructor(message, kind, status = null) {
        super(message);
        this.name = 'ApiError';
        this.kind = kind;       // 'network' | 'timeout' | 'server' | 'bad_request' | 'parse' | 'unknown'
        this.status = status;   // HTTP status when applicable
    }
}

// Error messages for the user in the event of an API error
// Right now, it's a bit difficult to check them all because you'll need 
// to intentionally trigger it with test code
const FRIENDLY_MESSAGES = {
    network: "Can't reach the server. Check your connection or try again in a moment.",
    timeout: 'That took too long. The server might be busy — please try again.',
    server: 'Something went wrong on our end. Please try again shortly.',
    bad_request: 'That request couldn\'t be processed. Try rephrasing and sending again.',
    validation: 'Your message is too long or empty. Please adjust and try again.',
    parse: 'We got an unexpected response from the server. Please try again.',
    unknown: 'Something went wrong. Please try again.',
};

export function errorMessage(err) {
    if (err instanceof ApiError) return FRIENDLY_MESSAGES[err.kind] || FRIENDLY_MESSAGES.unknown;
    return FRIENDLY_MESSAGES.unknown;
}

// Request handler with timeout
// We use this so we don't have to copy paste the same code over and over
async function request(path, options = {}) {
    // Standard JS API for cancelling ongoing async operations
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let res;
    try {
        res = await fetch(`${API_BASE}${path}`, { ...options, signal: controller.signal });
    } catch (err) {
        clearTimeout(timeoutId);
        // AbortError triggers for both our timeout and manual user-cancelled requests
        if (err.name === 'AbortError') {
            throw new ApiError('Request timed out', 'timeout');
        }
        // Error fetch for when the network connection failed somehow (DNS, CORS, Server not up, etc.)
        throw new ApiError('Network error', 'network');
    }
    clearTimeout(timeoutId);

    // Handler for non-2xx responses by our API
    if (!res.ok) {
        const contentType = res.headers.get('content-type') || '';
        let detail = null;
        if (contentType.includes('application/json')) {
            const data = await res.json().catch(() => null);
            detail = data?.detail || null;
        }

        if (res.status === 502 || res.status == 504 && !detail) {
            throw new ApiError('Upstream unavailable', 'network', 504);
        }

        if (res.status >= 500) {
            throw new ApiError(detail || 'Server error', 'server', res.status);
        }

        if (res.status === 422) {
            // This error is for our FastAPI/Pydantic validation failure which in most
            // cases will be the length cap for the input.
            throw new ApiError('Validation failed', 'validation', 422);
        }
        if (res.status >= 400) {
            // Standard client-side error
            throw new ApiError(detail || 'Bad request', 'bad_request', res.status);
        }
        throw new ApiError(detail || 'Request failed', 'unknown', res.status);
    }

    // Parse success response as JSON. 
    // If this errors, the server returned something unexpected (likely HTML) with a 200 status.
    // But if the code reaches this point, in most cases it'll go through fine.
    try {
        return await res.json();
    } catch {
        throw new ApiError('Invalid response format', 'parse');
    }
}

// Standard post to our backend
export async function sendMessage(prompt) {
    return request('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
    });
}

// Using our fetch handler
export async function fetchHistory() {
    return request('/history');
}

// Using our fetch handler
export async function clearHistory() {
    return request('/history', { method: 'DELETE' });
}