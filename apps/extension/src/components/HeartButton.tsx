interface HeartButtonProps {
    starred: boolean;
    onToggle: () => void;
    className?: string;
    size?: number;
}

/** Filled heart when starred, outline otherwise. Clicks never bubble to a surrounding link or card. */
export default function HeartButton({ starred, onToggle, className = '', size = 18 }: HeartButtonProps) {
    return (
        <button
            type="button"
            className={`heart-btn ${starred ? 'starred' : ''} ${className}`}
            title={starred ? 'Remove from favourites' : 'Add to favourites'}
            aria-pressed={starred}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggle();
            }}
        >
            <svg width={size} height={size} viewBox="0 0 24 24" fill={starred ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
        </button>
    );
}
