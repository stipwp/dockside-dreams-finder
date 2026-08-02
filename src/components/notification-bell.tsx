import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell } from "lucide-react";
import { listMyNotifications, markNotificationsRead } from "@/lib/trust.functions";

/** Header bell showing unread activity for the signed-in member. */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const fetchAll = useServerFn(listMyNotifications);
  const markRead = useServerFn(markNotificationsRead);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchAll(),
    refetchInterval: 60_000,
    retry: false,
  });

  const mark = useMutation({
    mutationFn: () => markRead({ data: {} }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const items = data ?? [];
  const unread = items.filter((n) => !n.read_at).length;

  return (
    <div className="relative">
      <button
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        onClick={() => {
          setOpen((v) => !v);
          if (!open && unread) mark.mutate();
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-border bg-popover shadow-card">
          <p className="border-b border-border px-4 py-3 text-sm font-bold">Notifications</p>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nothing yet.</p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  to={n.link ?? "/account"}
                  onClick={() => setOpen(false)}
                  className={`block border-b border-border px-4 py-3 last:border-0 hover:bg-muted ${
                    n.read_at ? "" : "bg-muted/50"
                  }`}
                >
                  <p className="text-sm font-semibold">{n.title}</p>
                  {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
