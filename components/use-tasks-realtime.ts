"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";

export interface TaskChange {
  id: string;
  is_done: boolean;
  completed_at: string | null;
}

/**
 * Berlangganan perubahan tabel `tasks` via Supabase Realtime.
 * Memanggil `onChange` tiap ada INSERT/UPDATE/DELETE pada task di proyek ini,
 * sehingga UI (mis. checkbox) bisa ikut berubah tanpa refresh manual.
 *
 * Realtime butuh RLS aktif pada tabel tasks; user hanya menerima baris miliknya.
 */
export function useTasksRealtime(
  projectId: string,
  onChange: (change: TaskChange) => void,
) {
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  React.useEffect(() => {
    if (!projectId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`tasks-project-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as
            | { id?: string; is_done?: boolean; completed_at?: string | null }
            | undefined;
          if (!row?.id) return;
          onChangeRef.current({
            id: row.id,
            is_done: Boolean(row.is_done),
            completed_at: row.completed_at ?? null,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);
}
