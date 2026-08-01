import { Link } from "@tanstack/react-router";
import { Globe } from "lucide-react";

const DESTINATIONS = [
  "Río Dulce, Guatemala",
  "Bocas del Toro, Panama",
  "Nassau, Bahamas",
  "Split, Croatia",
  "Phuket, Thailand",
  "Miami, United States",
  "Tortola, BVI",
  "Palma, Spain",
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-muted/50">
      <div className="mx-auto max-w-[100rem] px-4 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">Popular destinations</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {DESTINATIONS.slice(0, 4).map((d) => (
                <li key={d}>
                  <Link to="/rent" search={{ where: d.split(",")[0] } as never} className="hover:text-foreground hover:underline">
                    Docks in {d}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">More waters</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {DESTINATIONS.slice(4).map((d) => (
                <li key={d}>
                  <Link to="/rent" search={{ where: d.split(",")[0] } as never} className="hover:text-foreground hover:underline">
                    Docks in {d}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">Hosting</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/list-your-property" className="hover:text-foreground hover:underline">List your dock</Link></li>
              <li><Link to="/dashboard" className="hover:text-foreground hover:underline">Manage your docks</Link></li>
              <li><Link to="/bookings" className="hover:text-foreground hover:underline">Booking requests</Link></li>
              <li><Link to="/pricing" className="hover:text-foreground hover:underline">Plans & pricing</Link></li>
              <li><Link to="/how-it-works" className="hover:text-foreground hover:underline">How hosting works</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider">DockFront</p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground hover:underline">About</Link></li>
              <li><Link to="/help" className="hover:text-foreground hover:underline">Help centre</Link></li>
              <li><Link to="/contact" className="hover:text-foreground hover:underline">Contact & support</Link></li>
              <li><Link to="/rent" className="hover:text-foreground hover:underline">Find a dock</Link></li>
              <li><Link to="/trips" className="hover:text-foreground hover:underline">Your trips</Link></li>
              <li className="flex gap-3 pt-1">
                <Link to="/terms" className="hover:text-foreground hover:underline">Terms</Link>
                <Link to="/privacy" className="hover:text-foreground hover:underline">Privacy</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} DockFront — dock rentals worldwide.</span>
          <span className="inline-flex items-center gap-2 font-semibold text-foreground">
            <Globe className="h-3.5 w-3.5" /> English (US) · $ USD
          </span>
        </div>
      </div>
    </footer>
  );
}
