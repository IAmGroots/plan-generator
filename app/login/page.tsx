import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: redirectTo } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-screen max-w-[1200px] flex-col px-6">
      <header className="flex h-16 items-center justify-between border-b border-slate">
        <Link
          href="/"
          className="font-medium tracking-tight text-paper transition-colors duration-ui hover:text-accent"
        >
          Plan<span className="text-accent">Forge</span>
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center py-16">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-medium tracking-tight text-paper">
            Masuk ke workspace
          </h1>
          <p className="mt-2 text-sm text-fog">
            Pakai email dan password, atau lanjutkan dengan Google.
          </p>
          <LoginForm redirectTo={redirectTo ?? "/dashboard"} />
        </div>
      </div>
    </main>
  );
}
