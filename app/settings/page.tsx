import Link from "next/link";
import { getUserAiModel } from "@/lib/db/queries";
import { listModels } from "@/lib/ai/models";
import { ModelSelect } from "@/components/model-select";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function SettingsPage() {
  const [current, models] = await Promise.all([
    getUserAiModel(),
    listModels().catch(() => null),
  ]);

  const defaultModel = process.env.AI_MODEL ?? "";

  return (
    <div className="flex justify-center mt-16">
      <div className="max-w-2xl">
        <Link
          href="/dashboard"
          className="text-sm text-ash underline-offset-4 transition-colors duration-ui hover:text-paper hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-carbon"
        >
          Kembali
        </Link>

        <h1 className="text-2xl font-medium tracking-tight text-paper mt-4">
          Pengaturan
        </h1>

        <p className="mt-2 text-sm text-fog">
          Model AI dipakai untuk semua proyekmu. Pilih dari daftar model yang
          tersedia di 9Router.
        </p>

        <div className="mt-4">
          <ModelSelect
            models={models}
            current={current}
            defaultModel={defaultModel}
          />
        </div>
      </div>
    </div>
  );
}
