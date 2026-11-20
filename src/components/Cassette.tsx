import type { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const tracks = {
  profes: {
    code: "A1",
    name: "Profes",
    color: "bg-teacher",
    tint: "bg-teacher-tint",
    ring: "border-teacher",
  },
  escuelas: {
    code: "A2",
    name: "Escuelas",
    color: "bg-school",
    tint: "bg-school-tint",
    ring: "border-school",
  },
  bandas: {
    code: "B1",
    name: "Bandas",
    color: "bg-band",
    tint: "bg-band-tint",
    ring: "border-band",
  },
  locales: {
    code: "B2",
    name: "Locales",
    color: "bg-venue",
    tint: "bg-venue-tint",
    ring: "border-venue",
  },
} as const;
export type Track = keyof typeof tracks;

export function CassetteStripes({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("cassette-stripes", className)}>
      <span className="bg-teacher" />
      <span className="bg-coral" />
      <span className="bg-band" />
    </div>
  );
}
export function CassetteLogo({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 42" className={cn("h-8 w-12 shrink-0", className)}>
      <rect width="64" height="42" rx="8" className="fill-foreground" />
      <rect x="5" y="7" width="54" height="11" rx="2" className="fill-teacher" />
      <rect x="10" y="19" width="44" height="14" rx="7" className="fill-background" />
      <circle cx="19" cy="26" r="4" className="fill-foreground" />
      <circle cx="45" cy="26" r="4" className="fill-foreground" />
      <path d="M24 36h16l3 6H21z" className="fill-muted" />
    </svg>
  );
}
export function TrackCode({ track }: { track: Track }) {
  return (
    <span
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-foreground",
        tracks[track].color,
      )}
    >
      {tracks[track].code}
    </span>
  );
}
export function FilterChip({
  active,
  track,
  children,
  onClick,
  disabled,
}: {
  active: boolean;
  track: Track;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "min-h-10 border-2 px-4 text-sm",
        active ? `border-foreground ${tracks[track].color}` : "border-transparent bg-muted",
      )}
    >
      {children}
    </Button>
  );
}
export function CassetteCard({
  track,
  label,
  price,
  children,
  className,
}: {
  track: Track;
  label: string;
  price?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-[24px] bg-card shadow-cassette transition-shadow hover:shadow-elevated",
        className,
      )}
    >
      <div
        className={cn(
          "flex min-h-14 flex-wrap items-center justify-between gap-2 px-6 py-3 text-foreground",
          tracks[track].color,
        )}
      >
        <span className="text-xs font-bold uppercase">
          {tracks[track].code} · {label}
        </span>
        {price && (
          <span className="rounded-full bg-background px-3 py-1 text-sm font-semibold">
            {price}
          </span>
        )}
      </div>
      <CassetteStripes />
      <div className="p-6">{children}</div>
    </article>
  );
}
export function SiteFooter() {
  const path = useLocation({ select: (location) => location.pathname });
  const hasNote = path === "/" || path === "/explorar" || path === "/para-profes";
  return (
    <footer className="mt-14 border-t border-dotted py-8">
      <div className="page-width flex flex-wrap items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 font-display text-2xl">
          <CassetteLogo />
          ¿tocamos?
        </Link>
        <p className={hasNote ? "text-sm text-muted-foreground" : "font-hand text-2xl"}>
          hecho por y para músicos que empiezan
        </p>
      </div>
    </footer>
  );
}
