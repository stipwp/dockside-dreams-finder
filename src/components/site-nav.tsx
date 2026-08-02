import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Anchor, Menu, Search, Globe, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { NotificationBell } from "@/components/notification-bell";

export function SiteNav({ transparent = false }: { transparent?: boolean }) {
  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [where, setWhere] = useState("");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const checkAdmin = useServerFn(amIAdmin);
  const { data: gate } = useQuery({
    queryKey: ["am-i-admin"],
    queryFn: () => checkAdmin(),
    enabled: !!userEmail,
    retry: false,
  });
  const isAdmin = !!gate?.admin;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    setOpen(false);
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  function goSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/rent", search: (where ? { where } : {}) as never });
  }

  void transparent;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-20 max-w-[100rem] items-center justify-between gap-4 px-4 md:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <Anchor className="h-7 w-7 text-primary" strokeWidth={2.2} />
          <span className="hidden text-xl font-extrabold tracking-tight text-primary sm:inline">
            DockFront
          </span>
        </Link>

        <form
          onSubmit={goSearch}
          className="flex h-12 flex-1 items-center gap-2 rounded-full border border-border pl-5 pr-1.5 shadow-pill transition-shadow hover:shadow-card md:max-w-md"
        >
          <input
            value={where}
            onChange={(e) => setWhere(e.target.value)}
            placeholder="Search docks anywhere"
            aria-label="Search docks by destination"
            className="h-full w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            aria-label="Search"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Search className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </form>

        <div className="flex shrink-0 items-center gap-1">
          <Link
            to="/list-your-property"
            className="hidden rounded-full px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted lg:block"
          >
            List your dock
          </Link>
          <button
            className="hidden h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-muted lg:flex"
            aria-label="Language and region"
            onClick={() => navigate({ to: "/rent" })}
          >
            <Globe className="h-4 w-4" />
          </button>
          {userEmail && <NotificationBell />}
          <div className="relative">

            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
              aria-expanded={open}
              className="flex h-11 items-center gap-3 rounded-full border border-border px-3 shadow-sm transition-shadow hover:shadow-pill"
            >
              <Menu className="h-4 w-4" />
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background">
                <User className="h-4 w-4" />
              </span>
            </button>
            {open && (
              <div className="absolute right-0 top-14 w-60 overflow-hidden rounded-xl border border-border bg-popover py-2 shadow-card">
                {userEmail ? (
                  <>
                    <MenuLink to="/account" onClick={() => setOpen(false)} bold>Account</MenuLink>
                    <MenuLink to="/trips" onClick={() => setOpen(false)}>Your trips</MenuLink>
                    <MenuLink to="/wishlists" onClick={() => setOpen(false)}>Wishlist</MenuLink>
                    <MenuLink to="/bookings" onClick={() => setOpen(false)}>Booking requests</MenuLink>
                    <MenuLink to="/dashboard" onClick={() => setOpen(false)}>Manage docks</MenuLink>
                    <MenuLink to="/reviews" onClick={() => setOpen(false)}>Reviews</MenuLink>
                    {isAdmin && (
                      <MenuLink to="/admin" onClick={() => setOpen(false)} bold>Admin console</MenuLink>
                    )}
                    <div className="my-2 border-t border-border" />
                    <MenuLink to="/list-your-property" onClick={() => setOpen(false)}>List your dock</MenuLink>
                    <MenuLink to="/pricing" onClick={() => setOpen(false)}>Plans & pricing</MenuLink>
                    <MenuLink to="/help" onClick={() => setOpen(false)}>Help centre</MenuLink>
                    <button
                      onClick={signOut}
                      className="block w-full px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-muted"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <MenuLink to="/auth" onClick={() => setOpen(false)} bold>Sign up</MenuLink>
                    <MenuLink to="/auth" onClick={() => setOpen(false)}>Log in</MenuLink>
                    <div className="my-2 border-t border-border" />
                    <MenuLink to="/rent" onClick={() => setOpen(false)}>Find a dock</MenuLink>
                    <MenuLink to="/list-your-property" onClick={() => setOpen(false)}>List your dock</MenuLink>
                    <MenuLink to="/pricing" onClick={() => setOpen(false)}>Plans & pricing</MenuLink>
                    <MenuLink to="/help" onClick={() => setOpen(false)}>Help centre</MenuLink>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function MenuLink({
  to,
  onClick,
  children,
  bold,
}: {
  to: string;
  onClick: () => void;
  children: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <Link
      to={to as never}
      onClick={onClick}
      className={`block px-4 py-2.5 text-sm hover:bg-muted ${bold ? "font-semibold" : ""}`}
    >
      {children}
    </Link>
  );
}
