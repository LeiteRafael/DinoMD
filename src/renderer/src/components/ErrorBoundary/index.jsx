import { Component } from 'react'

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, info) {
        console.error('[DinoMD ErrorBoundary]', error, info)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', color: '#c0392b' }}>
                    <h2>Something went wrong</h2>
                    <p>{this.state.error?.message ?? 'An unexpected error occurred.'}</p>
                    <button onClick={() => this.setState({ hasError: false, error: null })}>
                        Try again
                    </button>
                </div>
            )
        }
        return this.props.children
    }
}
