import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact DockFront" },
      { name: "description", content: "Get in touch with the DockFront team." },
      { property: "og:title", content: "Contact — DockFront" },
      { property: "og:description", content: "Get in touch with the DockFront team." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-2xl px-4 py-24 text-center md:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teak">Contact</p>
        <h1 className="mt-2 font-serif text-5xl">Say hello.</h1>
        <p className="mt-6 text-muted-foreground">
          Questions, feedback, partnership ideas — we'd love to hear from you.
        </p>
        <a
          href="mailto:hello@dockfront.example"
          className="mt-10 inline-flex items-center gap-2 rounded-sm bg-teak px-8 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-teak-foreground"
        >
          <Mail className="h-4 w-4" /> hello@dockfront.example
        </a>
      </main>
      <SiteFooter />
    </div>
  );
}
