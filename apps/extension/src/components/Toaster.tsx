import { useToastStore } from '../store/useToastStore';

export default function Toaster() {
    const toasts = useToastStore(state => state.toasts);
    const dismiss = useToastStore(state => state.dismiss);

    if (toasts.length === 0) return null;

    return (
        <div className="toaster" role="status" aria-live="polite">
            {toasts.map(t => (
                <div key={t.id} className={`toast toast-${t.kind}`}>
                    <span>{t.message}</span>
                    <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss">×</button>
                </div>
            ))}
        </div>
    );
}
