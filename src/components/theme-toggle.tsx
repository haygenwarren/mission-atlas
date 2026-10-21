"use client";

// The current theme lives on <html data-theme>, set before first paint by the
// script in the root layout. Both icons are rendered and CSS shows the right
// one (a sun to switch to light, a moon to switch to dark), so the button
// needs no state and cannot disagree with the page.
export default function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "light" ? "dark" : "light";

    root.dataset.theme = next;

    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage can be unavailable (private browsing); the switch still
      // works for this page view.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-lg p-1.5 text-muted transition-colors hover:text-foreground"
    >
      <span className="light:hidden">
        <span className="sr-only">Switch to light mode</span>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </svg>
      </span>
      <span className="hidden light:block">
        <span className="sr-only">Switch to dark mode</span>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        >
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        </svg>
      </span>
    </button>
  );
}
