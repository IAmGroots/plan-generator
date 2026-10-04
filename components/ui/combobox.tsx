"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ComboboxItem {
  value: string;
  label: string;
  group: string;
}

/**
 * Combobox dengan pencarian. Dipakai untuk memilih dari ratusan item, di mana
 * select native tidak praktis. Keyboard: panah atas/bawah, Enter memilih,
 * Escape menutup, dan fokus tetap terlihat.
 */
export function Combobox({
  items,
  value,
  onChange,
  placeholder = "Cari...",
  emptyText = "Tidak ada hasil.",
  id,
}: {
  items: ComboboxItem[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  id?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [highlight, setHighlight] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const selectedItem = items.find((i) => i.value === value);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 300); // batasi render awal demi performa
    return items
      .filter(
        (i) =>
          i.value.toLowerCase().includes(q) ||
          i.group.toLowerCase().includes(q),
      )
      .slice(0, 300);
  }, [items, query]);

  // Tutup saat klik di luar.
  React.useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Jaga item yang disorot tetap terlihat.
  React.useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[highlight] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  function openList() {
    setOpen(true);
    setQuery("");
    const idx = selectedItem
      ? filtered.findIndex((i) => i.value === selectedItem.value)
      : 0;
    setHighlight(idx >= 0 ? idx : 0);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function select(item: ComboboxItem) {
    onChange(item.value);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "Enter" || e.key === "ArrowDown") {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlight]) select(filtered[highlight]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  let lastGroup = "";

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-md border border-slate bg-carbon px-3 text-left text-sm text-mist transition-colors duration-ui hover:border-smoke focus-visible:border-mist focus-visible:outline-none"
      >
        <span className={cn("truncate", !selectedItem && "text-ash")}>
          {selectedItem ? selectedItem.label : placeholder}
        </span>
        <span aria-hidden="true" className="shrink-0 font-mono text-xs text-ash">
          {open ? "tutup" : "cari"}
        </span>
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-full rounded-md border border-slate bg-carbon shadow-overlay">
          <div className="border-b border-slate p-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Ketik untuk mencari model..."
              aria-label="Cari model"
              className="h-9 w-full rounded-sm border border-slate bg-white/[0.02] px-2.5 text-sm text-mist placeholder:text-ash focus-visible:border-mist focus-visible:outline-none"
            />
          </div>

          <div
            ref={listRef}
            role="listbox"
            className="max-h-72 overflow-auto p-1"
          >
            {filtered.length === 0 && (
              <p className="px-3 py-6 text-center text-[13px] text-ash">
                {emptyText}
              </p>
            )}
            {filtered.map((item, i) => {
              const showGroup = item.group !== lastGroup;
              lastGroup = item.group;
              return (
                <React.Fragment key={item.value}>
                  {showGroup && (
                    <p className="px-3 pb-1 pt-3 font-mono text-[11px] uppercase tracking-wide text-ash">
                      {item.group}
                    </p>
                  )}
                  <button
                    type="button"
                    role="option"
                    aria-selected={item.value === value}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => select(item)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-sm px-3 py-2 text-left text-[13px] transition-colors duration-ui",
                      i === highlight
                        ? "bg-slate/80 text-paper"
                        : "text-mist",
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                    {item.value === value && (
                      <span className="shrink-0 font-mono text-xs text-accent">
                        aktif
                      </span>
                    )}
                  </button>
                </React.Fragment>
              );
            })}
            {filtered.length === 300 && (
              <p className="px-3 py-3 text-center text-[12px] text-ash">
                Menampilkan 300 hasil pertama. Persempit pencarian.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
