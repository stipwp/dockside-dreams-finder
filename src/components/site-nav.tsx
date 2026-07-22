import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Anchor, Menu, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const NAV = [
  { to: "/listings", label: "Browse" },
  { to: "/map", label: "Map" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteNav({ transparent = false }: { transparent?: boolean }) {
  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header
      className={
        transparent
          ? "absolute inset-x-0 top-0 z-30 bg-nav/85 text-nav-foreground backdrop-blur-sm"
          : "sticky top-0 z-30 bg-nav text-nav-foreground"
      }
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2 text-nav-foreground">
          <Anchor className="h-5 w-5 text-teak" strokeWidth={1.5} />
          <span className="font-serif text-xl tracking-wide">DockFront</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-xs font-medium uppercase tracking-[0.14em] text-nav-foreground/85 transition-colors hover:text-teak"
              activeProps={{ className: "text-teak" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {userEmail ? (
            <>
              <Link
                to="/dashboard"
                className="text-xs font-medium uppercase tracking-[0.14em] text-nav-foreground/85 hover:text-teak"
              >
                Dashboard
              </Link>
              <button
                onClick={signOut}
                className="text-xs font-medium uppercase tracking-[0.14em] text-nav-foreground/60 hover:text-teak"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="text-xs font-medium uppercase tracking-[0.14em] text-nav-foreground/85 hover:text-teak"
            >
              Sign in
            </Link>
          )}
          <Link
            to="/list-your-property"
            className="rounded-sm bg-teak px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-teak-foreground transition-colors hover:bg-teak/90"
          >
            List your property
          </Link>
        </div>

        <button
          className="md:hidden text-nav-foreground"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-nav md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="py-2 text-sm uppercase tracking-widest text-nav-foreground/85"
              >
                {n.label}
              </Link>
            ))}
            {userEmail ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="py-2 text-sm uppercase tracking-widest text-nav-foreground/85">
                  Dashboard
                </Link>
                <button onClick={signOut} className="py-2 text-left text-sm uppercase tracking-widest text-nav-foreground/60">
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className="py-2 text-sm uppercase tracking-widest text-nav-foreground/85">
                Sign in
              </Link>
            )}
            <Link
              to="/list-your-property"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-sm bg-teak px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-teak-foreground"
            >
              List your property
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
