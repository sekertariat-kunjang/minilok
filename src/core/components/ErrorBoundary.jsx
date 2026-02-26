import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2rem',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc'
                }}>
                    <div style={{
                        maxWidth: '400px',
                        padding: '2rem',
                        background: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}>
                        <h2 style={{ color: '#0f172a', marginBottom: '1rem' }}>Ups! Terjadi Kesalahan</h2>
                        <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.875rem' }}>
                            Aplikasi mengalami kendala teknis yang tidak terduga. Silakan coba muat ulang halaman.
                        </p>
                        <button
                            onClick={this.handleReload}
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                        >
                            Muat Ulang Aplikasi
                        </button>
                        {process.env.NODE_ENV === 'development' && (
                            <details style={{ marginTop: '2rem', textAlign: 'left', fontSize: '0.75rem' }}>
                                <summary style={{ cursor: 'pointer', color: '#94a3b8' }}>Detail Error (Dev Only)</summary>
                                <pre style={{
                                    marginTop: '0.5rem',
                                    padding: '0.5rem',
                                    background: '#f1f5f9',
                                    borderRadius: '4px',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-all'
                                }}>
                                    {this.state.error?.toString()}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
