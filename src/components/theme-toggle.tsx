"use client";

// The current theme lives on <html data-theme>, set before first paint by the
// script in the root layout. Both labels are rendered and CSS shows the right
// one, so the button needs no state and cannot disagree with the page.
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
      className="label-caps rounded-lg border border-border-strong px-3 py-2 text-muted transition-colors hover:border-accent hover:text-foreground"
    >
      <span className="light:hidden">Light mode</span>
      <span className="hidden light:inline">Dark mode</span>
    </button>
  );
}
