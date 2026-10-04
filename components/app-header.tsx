import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { getUserAiModel } from "@/lib/db/queries";
import { cn } from "@/lib/utils";

export async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initial = (user?.email ?? "?").charAt(0).toUpperCase();
  const activeModel =
    (await getUserAiModel()) ?? process.env.AI_MODEL ?? "belum diatur";

  return (
    <header className="border-b border-slate">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <Link
          href="/dashboard"
          className="text-xl font-medium tracking-tight text-paper transition-colors duration-ui hover:text-accent"
        >
          Plan<span className="text-accent">Forge</span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/settings"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            title={`Model AI: ${activeModel}`}
          >
            <span className="text-ash">Model AI:</span>
            <span className="truncate font-mono text-accent">{activeModel}</span>
          </Link>
          <Link
            href="/settings"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Pengaturan
          </Link>
          <span className="hidden items-center gap-2 lg:flex">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded-pill bg-accent-soft font-mono text-xs text-accent"
            >
              {initial}
            </span>
            <span className="max-w-[150px] truncate text-[13px] text-fog">
              {user?.email}
            </span>
          </span>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm">
              Keluar
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
