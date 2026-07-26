import nodemailer from "nodemailer";

const FROM_ADDRESS = process.env.MAIL_FROM ?? "noreply@sayyes.fun";

const globalForMail = globalThis as unknown as {
  mailTransport?: ReturnType<typeof nodemailer.createTransport>;
};

// The env check and transport creation are deferred to first *send*, not module
// load — Next's "collecting page data" build step imports every route module
// (including this one) even though nothing is actually sent during a build, and
// a top-level throw here would fail `npm run build` on a checkout with no
// SMTP_PASSWORD. Same reasoning as prisma.ts, but the precedent doesn't
// transfer directly: DATABASE_URL really is needed at build time, SMTP_PASSWORD
// is not.
function getTransport() {
  if (!process.env.SMTP_PASSWORD) {
    throw new Error(
      "SMTP_PASSWORD is not set. Add it to .env — see .env.example for where to get it."
    );
  }
  const transport =
    globalForMail.mailTransport ??
    nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: { user: "resend", pass: process.env.SMTP_PASSWORD },
    });

  // Reuse one transport across hot reloads in dev, same reasoning as prisma.ts.
  if (process.env.NODE_ENV !== "production") globalForMail.mailTransport = transport;

  return transport;
}

/** Rejects on any SMTP failure — the caller decides what that means. */
export async function sendMail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  await getTransport().sendMail({ from: FROM_ADDRESS, to, subject, text });
}
