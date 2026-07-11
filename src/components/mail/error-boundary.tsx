"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface MailErrorBoundaryProps {
  children: React.ReactNode;
}

interface MailErrorBoundaryState {
  hasError: boolean;
}

export class MailErrorBoundary extends React.Component<
  MailErrorBoundaryProps,
  MailErrorBoundaryState
> {
  constructor(props: MailErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
          <p className="text-sm font-medium text-foreground">
            Something went wrong loading your mail.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
          >
            Reload
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
