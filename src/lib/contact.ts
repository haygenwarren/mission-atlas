"use server";

// The About section's "Reach out!" form. It runs on the server, checks the
// message, and emails it to the site's owner through Resend (resend.com).
// The visitor's address, when they give one, becomes the reply-to, so
// answering is an ordinary reply.
//
// Needs two environment variables, set in Vercel and never committed:
//   RESEND_API_KEY     the key from Resend's dashboard
//   CONTACT_TO_EMAIL   where messages go
// CONTACT_FROM_EMAIL is optional. Until a domain is verified with Resend, it
// sends from onboarding@resend.dev, and only to the address the Resend
// account was made with, which is all a contact form needs.

export type ContactValues = { name: string; email: string; message: string };

export type ContactState =
  | { status: "idle" }
  | { status: "sent" }
  // The visitor's words come back with an error, since React empties the
  // form after every submission and they shouldn't have to type it again.
  | { status: "error"; error: string; values: ContactValues };

// Kept in step with the form's maxLength attributes.
const LIMITS = { name: 100, email: 200, message: 5000 };

const looksLikeEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const UNAVAILABLE =
  "Your message couldn't be sent just now. Please try again in a little while.";

export async function sendMessage(
  _previous: ContactState,
  form: FormData,
): Promise<ContactState> {
  const field = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  // One line, since it goes into the subject.
  const name = field("name").replace(/\s+/g, " ");
  const email = field("email");
  const message = field("message");
  const failed = (error: string): ContactState => ({
    status: "error",
    error,
    values: { name, email, message },
  });

  // A field visitors never see, which only bots fill in. They are told the
  // message went, so they have no reason to try again.
  if (field("website")) return { status: "sent" };

  // The form checks these too, but anyone can post to this action directly.
  if (!message) return failed("Please write a message.");
  if (
    name.length > LIMITS.name ||
    email.length > LIMITS.email ||
    message.length > LIMITS.message
  ) {
    return failed("That's longer than the form allows.");
  }
  if (email && !looksLikeEmail(email)) {
    return failed("That email address doesn't look right.");
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!key || !to) {
    console.error("Contact form: RESEND_API_KEY or CONTACT_TO_EMAIL is not set.");
    return failed(UNAVAILABLE);
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:
        process.env.CONTACT_FROM_EMAIL ?? "Mission Atlas <onboarding@resend.dev>",
      to: [to],
      subject: `Mission Atlas: a message from ${name || "a visitor"}`,
      text: [
        `Name: ${name || "(not given)"}`,
        `Email: ${email || "(not given)"}`,
        "",
        message,
      ].join("\n"),
      ...(email && { reply_to: email }),
    }),
    signal: AbortSignal.timeout(10_000),
  }).catch((error: unknown) => {
    console.error("Contact form: Resend could not be reached.", error);
    return null;
  });

  if (!response) return failed(UNAVAILABLE);
  if (!response.ok) {
    console.error(
      `Contact form: Resend refused the message (${response.status}).`,
      await response.text(),
    );
    return failed(UNAVAILABLE);
  }

  return { status: "sent" };
}
