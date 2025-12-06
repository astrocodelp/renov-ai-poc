import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { authClient } from "@/lib/auth-client";
import { Github, Loader2, LogIn, ArrowLeft } from "lucide-react";

const providers = [
  {
    id: "github" as const,
    label: "Continue with GitHub",
    icon: <Github className="h-5 w-5" />,
  },
  {
    id: "google" as const,
    label: "Continue with Google",
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 256 262" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M255.68 133.47c0-10.57-.86-18.29-2.73-26.24H130.55v47.59h71.98c-1.45 12.09-9.32 30.27-26.79 42.48l-.24 1.63 38.91 30.17 2.69.27c24.73-22.8 38.58-56.33 38.58-96.9"
          fill="#4285F4"
        />
        <path
          d="M130.55 261.1c35.15 0 64.72-11.62 86.29-31.64l-41.09-31.82c-11.02 7.71-25.82 13.1-45.2 13.1-34.52 0-63.8-22.8-74.23-54.36l-1.53.13-40.23 31.17-.53 1.49C35.87 231.99 79.73 261.1 130.55 261.1"
          fill="#34A853"
        />
        <path
          d="M56.32 156.38c-2.78-8.08-4.38-16.7-4.38-25.58 0-8.88 1.6-17.5 4.22-25.58l-.07-1.71-40.73-31.64-1.33.63C4.9 91.26 0 110.18 0 130.8c0 20.62 4.9 39.54 13.96 57.3z"
          fill="#FBBC05"
        />
        <path
          d="M130.55 50.95c24.45 0 40.93 10.57 50.3 19.39l36.7-35.9C195.15 12.35 165.7 0 130.55 0 79.73 0 35.87 29.11 13.96 73.5l40.21 31.71c10.6-31.56 39.88-54.26 74.38-54.26"
          fill="#EB4335"
        />
      </svg>
    ),
  },
];

export const Route = createFileRoute("/login")({
  component: LoginRouteComponent,
});

function LoginRouteComponent() {
  const session = useStore(authClient.useSession);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  useEffect(() => {
    if (session.data?.user) {
      navigate({ to: "/dashboard" });
    }
  }, [navigate, session.data?.user]);

  const handleSocialLogin = async (provider: "github" | "google") => {
    setError(null);
    setLoadingProvider(provider);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: "/dashboard",
        errorCallbackURL: "/login",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to start sign-in flow";
      setError(message);
      setLoadingProvider(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/40 to-background text-foreground flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card/80 shadow-2xl shadow-primary/20 backdrop-blur">
        <div className="grid md:grid-cols-2 gap-8 p-8">
          <div className="flex flex-col gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline w-fit"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Welcome back
            </span>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <LogIn className="h-5 w-5" />
              </div>
              <h1 className="text-3xl font-bold leading-tight font-display">
                Sign in to RenovAI
              </h1>
            </div>
            <p className="text-muted-foreground">
              Use your social account to continue. We only support GitHub and Google.
            </p>
            <div className="h-px w-16 bg-primary/60" />
          </div>

          <div className="flex flex-col gap-3">
            {providers.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleSocialLogin(provider.id)}
                disabled={session.isPending || Boolean(session.data) || Boolean(loadingProvider)}
                className="inline-flex items-center justify-center gap-3 rounded-xl border border-border bg-card hover:bg-muted px-4 py-3 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary/60 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loadingProvider === provider.id ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  provider.icon
                )}
                {provider.label}
              </button>
            ))}

            {error ? (
              <div className="mt-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
                {error}
              </div>
            ) : null}

            <p className="text-sm text-muted-foreground mt-4">
              Already signed in?{" "}
              <Link to="/dashboard" className="text-primary hover:underline font-semibold">
                Go to your dashboard
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}