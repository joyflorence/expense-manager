import {Component, StrictMode, type ErrorInfo, type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ fontFamily: 'system-ui', padding: '2rem', color: '#0f172a' }}>
          <h1>Expense Manager could not start</h1>
          <p>{this.state.error.message}</p>
          <p>Open the browser console for the component stack, then reload the page after deploying the latest build.</p>
        </main>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
