"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendMessage, type ContactState } from "@/lib/contact";

// The "Reach out!" pill in the About section, and the dialog it opens with a
// short form. Escape, the close button or a click outside the dialog closes
// it. A half-written message is kept if the dialog closes; a sent one is
// cleared, so the next visit starts with an empty form.
export default function ContactDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Changing the key gives the form a fresh start.
  const [round, setRound] = useState(0);
  const sent = useRef(false);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="ml-1 inline-flex items-center gap-2 rounded-full bg-button px-4 py-1.5 align-middle text-sm font-semibold text-button-text transition-opacity hover:opacity-90"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
        Reach out!
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="contact-title"
        onClose={() => {
          if (sent.current) {
            sent.current = false;
            setRound((n) => n + 1);
          }
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="m-auto w-[calc(100vw-2rem)] max-w-lg rounded-xl border border-border bg-surface p-0 text-foreground backdrop:bg-background/80 backdrop:backdrop-blur-sm"
      >
        <ContactForm
          key={round}
          onSent={() => (sent.current = true)}
          onClose={() => dialogRef.current?.close()}
        />
      </dialog>
    </>
  );
}

const labelClasses = "text-sm font-medium";

function ContactForm({
  onSent,
  onClose,
}: {
  onSent: () => void;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<ContactState, FormData>(
    sendMessage,
    { status: "idle" },
  );
  const values = state.status === "error" ? state.values : undefined;

  useEffect(() => {
    if (state.status === "sent") onSent();
  }, [state.status, onSent]);

  const closeButton = (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="rounded-full p-1.5 text-muted transition-colors hover:text-foreground"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden
      >
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    </button>
  );

  if (state.status === "sent") {
    return (
      <div className="p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 id="contact-title" className="font-display text-2xl">
            Message sent
          </h2>
          {closeButton}
        </div>
        <p className="mt-3 leading-relaxed text-foreground/90">
          Thanks for getting in touch! If you left your email address,
          you&apos;ll hear back there.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 rounded-full bg-button px-5 py-2 font-medium text-button-text transition-opacity hover:opacity-90"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-caps text-muted">Get in touch</p>
          <h2 id="contact-title" className="font-display mt-1 text-2xl">
            Send a message
          </h2>
        </div>
        {closeButton}
      </div>

      <div className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className={labelClasses}>
              Name <span className="text-muted">(optional)</span>
            </span>
            <input
              name="name"
              autoComplete="name"
              maxLength={100}
              defaultValue={values?.name}
              className="field w-full"
            />
          </label>
          <label className="grid gap-1.5">
            <span className={labelClasses}>
              Email <span className="text-muted">(for a reply)</span>
            </span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              maxLength={200}
              defaultValue={values?.email}
              className="field w-full"
            />
          </label>
        </div>

        <label className="grid gap-1.5">
          <span className={labelClasses}>Message</span>
          <textarea
            name="message"
            required
            rows={6}
            maxLength={5000}
            defaultValue={values?.message}
            className="field w-full resize-y"
          />
        </label>

        {/* Hidden from people and screen readers; only bots fill it in. */}
        <div aria-hidden className="absolute -left-[9999px]">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        {state.status === "error" && (
          <p role="alert" className="text-sm text-status-failed">
            {state.error}
          </p>
        )}
      </div>

      <div className="mt-6 flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-accent hover:underline"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-button px-5 py-2 font-medium text-button-text transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
