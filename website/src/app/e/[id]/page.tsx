"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type EventData = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  eventDate: string;
  latitude: number;
  longitude: number;
};

function EventContent() {
  const params = useParams();
  const id = (params?.id as string)?.trim() ?? "";
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Invalid event link");
      return;
    }
    let cancelled = false;
    fetch(`/api/events/${encodeURIComponent(id)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Event not found");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setEvent(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Event not found");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const deepLink = id ? `ringtap://map/event/${id}` : "ringtap://";
  const appStoreUrl = "https://apps.apple.com/us/app/ringtap-me/id6758565822";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <p className="text-muted-light">Loading event…</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-4">
        <h1 className="text-xl font-bold text-foreground">Event not found</h1>
        <p className="text-muted-light text-center">
          This event may have been removed or the link is invalid.
        </p>
        <Link
          href="https://www.ringtap.me"
          className="inline-flex items-center justify-center rounded-xl bg-accent px-6 py-4 text-background font-semibold hover:opacity-90"
        >
          Open RingTap
        </Link>
      </div>
    );
  }

  const dateStr = new Date(event.eventDate).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-6 py-12">
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.name}
            className="w-full aspect-video object-cover rounded-xl mb-6"
          />
        )}
        <h1 className="text-2xl font-bold text-foreground mb-2">{event.name}</h1>
        <p className="text-muted-light mb-4">{dateStr}</p>
        {event.description && (
          <p className="text-foreground/90 mb-6">{event.description}</p>
        )}
        <div className="flex flex-col gap-3">
          <a
            href={deepLink}
            className="inline-flex items-center justify-center rounded-xl bg-accent px-6 py-4 text-background font-semibold hover:opacity-90"
          >
            Open in RingTap App
          </a>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-4 text-foreground font-semibold hover:bg-surface"
          >
            Get directions
          </a>
          <p className="text-sm text-muted-light text-center mt-4">
            Don&apos;t have the app?{" "}
            <a
              href={appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              Download RingTap
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function EventPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-light">Loading…</p>
        </div>
      }
    >
      <EventContent />
    </Suspense>
  );
}
