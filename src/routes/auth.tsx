import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { SiteNav } from "@/components/site-nav";
import { toast } from "sonner";
import { Anchor } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — DockFront" },
      { name: "description", content: "Sign in to your DockFront account to manage your listings." },
      { property: "og:title", content: "Sign in — DockFront" },
      { property: "og:description", content: "Access your DockFront owner dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name || undefined },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Account created — you're signed in.");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  async function googleSignIn() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20">
        <Anchor className="h-8 w-8 text-teak" strokeWidth={1.5} />
        <h1 className="mt-4 font-serif text-4xl">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin" ? "Sign in to manage your listings." : "List your first waterfront property in minutes."}
        </p>

        <button
          onClick={googleSignIn}
          className="mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-sm border border-border bg-background text-sm font-medium transition-colors hover:bg-muted"
        >
          <GoogleIcon /> Continue with Google
        </button>

        <div className="my-6 flex w-full items-center gap-4 text-xs uppercase tracking-widest text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="w-full space-y-3">
          {mode === "signup" && (
            <input
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              className="h-11 w-full rounded-sm border border-input bg-transparent px-3 text-sm"
            />
          )}
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-sm border border-input bg-transparent px-3 text-sm"
          />
          <input
            required
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            className="h-11 w-full rounded-sm border border-input bg-transparent px-3 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="h-11 w-full rounded-sm bg-teak text-xs font-semibold uppercase tracking-[0.16em] text-teak-foreground disabled:opacity-60"
          >
            {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
          className="mt-6 text-xs uppercase tracking-widest text-muted-foreground hover:text-teak"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>

        <Link to="/" className="mt-8 text-xs uppercase tracking-widest text-muted-foreground hover:text-teak">
          ← Back home
        </Link>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.3h5.9c-.3 1.4-1 2.5-2.2 3.3v2.7h3.6c2.1-1.9 3.2-4.8 3.2-8.1z" />
      <path fill="#34A853" d="M12 23c2.9 0 5.3-1 7.1-2.6l-3.6-2.7c-1 .7-2.3 1.1-3.5 1.1-2.7 0-5-1.8-5.8-4.3H2.5v2.7C4.3 20.9 7.9 23 12 23z" />
      <path fill="#FBBC05" d="M6.2 14.5c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2V7.4H2.5C1.7 8.9 1.3 10.4 1.3 12s.4 3.1 1.2 4.6l3.7-2.1z" />
      <path fill="#EA4335" d="M12 5.5c1.6 0 3 .5 4.1 1.5l3.1-3.1C17.3 2.1 14.9 1 12 1 7.9 1 4.3 3.1 2.5 6.4l3.7 2.7C7 7.3 9.3 5.5 12 5.5z" />
    </svg>
  );
}
