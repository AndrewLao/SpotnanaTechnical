// Simple Header
export default function Header({ onClear, canClear }) {
    return (
        <header className="header">
            <div className="header-left">
                <div className="avatar avatar-sm">AI</div>
                <div>
                    <p className="header-name">Spotnana - Anna</p>
                    <p className="header-sub">Here to help</p>
                </div>
            </div>
            <button
                className="clear-btn"
                onClick={onClear}
                disabled={!canClear}
                aria-label="Clear conversation"
            >
                Clear
            </button>
        </header>
    );
}
