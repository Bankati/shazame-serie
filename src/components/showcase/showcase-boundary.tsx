"use client";

import { Component } from "react";

import { reportBoundaryError } from "@/client/observability/posthog";

// Limite d'erreur des décors de l'accueil (rangées, genres) : une erreur dans une animation ou un
// carrousel ne doit jamais faire tomber la page, ni surtout la zone d'envoi du clip. En cas d'erreur, le
// repli (`fallback`) remplace le décor et l'erreur part dans PostHog comme celles des pages d'erreur.
type Props = { children: React.ReactNode; fallback: React.ReactNode };
type State = { failed: boolean };

export class ShowcaseBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error): void {
    reportBoundaryError(error);
  }

  render(): React.ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
