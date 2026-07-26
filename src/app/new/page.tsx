import Link from "next/link";
import { BuilderForm } from "@/components/BuilderForm";
import { Sparkles } from "@/components/Sparkles";

export default function NewInvitationPage() {
  return (
    <>
      <Sparkles />
      <main className="relative z-10 mx-auto w-full max-w-2xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-rose-deep">הזמנה חדשה</h1>
          <Link
            href="/"
            className="rounded-2xl border-2 border-blush-deep bg-white px-4 py-2 font-bold text-rose-ink/70 transition hover:bg-blush"
          >
            ← לרשימה
          </Link>
        </div>
        <BuilderForm />
      </main>
    </>
  );
}
