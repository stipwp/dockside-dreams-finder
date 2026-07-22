import { Link } from "@tanstack/react-router";
import { Anchor } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-nav text-nav-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <Anchor className="h-6 w-6 text-teak" strokeWidth={1.5} />
              <span className="font-serif text-2xl">DockFront</span>
            </Link>
            <p className="mt-4 max-w-md text-sm text-nav-foreground/70">
              A private marketplace for waterfront homes with docks and boat slips —
              listed directly by owners, for boat owners. No agents. No commissions.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teak">Explore</p>
            <ul className="mt-4 space-y-2 text-sm text-nav-foreground/80">
              <li><Link to="/listings" className="hover:text-teak">Browse listings</Link></li>
              <li><Link to="/map" className="hover:text-teak">Map search</Link></li>
              <li><Link to="/list-your-property" className="hover:text-teak">List your property</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teak">Company</p>
            <ul className="mt-4 space-y-2 text-sm text-nav-foreground/80">
              <li><Link to="/how-it-works" className="hover:text-teak">How it works</Link></li>
              <li><Link to="/about" className="hover:text-teak">About</Link></li>
              <li><Link to="/contact" className="hover:text-teak">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-white/10 pt-6 text-xs uppercase tracking-widest text-nav-foreground/50">
          © {new Date().getFullYear()} DockFront. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
