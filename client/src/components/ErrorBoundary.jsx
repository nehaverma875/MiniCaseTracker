import { Component } from 'react';
import { Alert, Button, Card, CardContent } from './ui';

export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="page-shell" style={{ display: 'grid', minHeight: '100vh', placeItems: 'center' }}>
        <Card style={{ width: 'min(520px, 100%)' }}>
          <CardContent className="stack">
            <h1 className="page-title" style={{ fontSize: 32 }}>
              Something went wrong
            </h1>
            <Alert variant="error">Please refresh the page. If the issue continues, sign in again.</Alert>
            <Button type="button" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
}
