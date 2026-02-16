"use client";

import { useState } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <p className="text-sm text-accent font-medium">
        Thanks! We&apos;ll keep you updated.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        disabled={status === "loading"}
        className="flex-1 rounded-xl border border-border-light bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-background hover:bg-muted-light transition-colors disabled:opacity-60"
      >
        {status === "loading" ? "..." : "Get updates"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-500 sm:col-span-2">Something went wrong. Try again.</p>
      )}
    </form>
  );
}
