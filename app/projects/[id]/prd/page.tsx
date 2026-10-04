import { getPrd } from "@/lib/db/queries";
import { PrdView } from "./prd-view";

export default async function PrdStepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prd = await getPrd(id);

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-medium tracking-tight text-paper">
        Langkah 3 - PRD
      </h1>
      <p className="mt-1.5 text-sm text-fog">
        {prd
          ? "Tinjau hasilnya. Kamu bisa mengedit tiap bagian sebelum lanjut."
          : "Belum ada PRD. Buat dari ide dan jawaban yang sudah dikumpulkan."}
      </p>
      <PrdView projectId={id} initialPrd={prd} />
    </div>
  );
}
