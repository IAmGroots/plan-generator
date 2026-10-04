import { getClarifyMessages } from "@/lib/db/queries";
import { buildQaFromMessages, parseAssistantQuestions } from "@/lib/clarify";
import { ClarifyChat, type Turn } from "./clarify-chat";

export default async function ClarifyStepPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const messages = await getClarifyMessages(id);

  const history: Turn[] = messages.map((m) => {
    if (m.role === "assistant") {
      const parsed = JSON.parse(m.content) as { isComplete?: boolean };
      return {
        role: "assistant",
        questions: parseAssistantQuestions(m.content),
        isComplete: parsed.isComplete ?? false,
      };
    }
    return { role: "user", answers: m.content.split("\n\n") };
  });

  const qa = buildQaFromMessages(
    messages.map((m) => ({ role: m.role, content: m.content })),
  );

  // Kunci stabil dari posisi turn terakhir + id pertanyaannya. Menyertakan
  // history.length membuat kunci tetap berubah walau id pertanyaan terulang
  // (mis. saat "Tanya lagi"), sehingga React me-reset state ClarifyChat.
  const lastTurn = history[history.length - 1];
  const questionKey =
    lastTurn && lastTurn.role === "assistant"
      ? `${history.length}-${lastTurn.questions.map((q) => q.id).join("|")}`
      : `${history.length}-empty`;

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-medium tracking-tight text-paper">
        Langkah 2 - Klarifikasi
      </h1>
      <p className="mt-1.5 text-sm text-fog">
        AI menanyakan hal yang memengaruhi keputusan teknis. Jawab seperlunya,
        lalu minta pertanyaan berikutnya sampai dirasa cukup.
      </p>
      <ClarifyChat
        key={questionKey}
        projectId={id}
        history={history}
        answeredCount={qa.length}
      />
    </div>
  );
}
