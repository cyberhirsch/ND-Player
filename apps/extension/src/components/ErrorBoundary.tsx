import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    error: Error | null;
}

/** Keeps a crash in one page from blanking the whole player. Reset by remounting (keyed on the route). */
export default class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('Page crashed:', error, info.componentStack);
    }

    render() {
        if (!this.state.error) return this.props.children;
        return (
            <div className="error-boundary">
                <h2>This page hit an error</h2>
                <p className="error-boundary-message">{this.state.error.message}</p>
                <button className="btn-primary" onClick={() => this.setState({ error: null })}>Try again</button>
            </div>
        );
    }
}
