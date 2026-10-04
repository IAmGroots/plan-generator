"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loginWithPassword,
  signInWithGoogle,
  signUpWithPassword,
} from "./actions";

type Mode = "login" | "register";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [mode, setMode] = React.useState<Mode>("login");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    setNotice(null);
    formData.set("redirect", redirectTo);
    const result =
      mode === "login"
        ? await loginWithPassword(formData)
        : await signUpWithPassword(formData);

    if (result && "error" in result && result.error) setError(result.error);
    if (result && "success" in result && result.success) {
      setNotice(result.success);
    }
    setPending(false);
  }

  async function onGoogle() {
    setPending(true);
    setError(null);
    const result = await signInWithGoogle();
    if (result && "error" in result && result.error) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <div className="mt-8">
      <div
        role="tablist"
        aria-label="Pilih metode"
        className="mb-6 flex gap-1 rounded-md bg-white/[0.03] p-1"
      >
        {(["login", "register"] as Mode[]).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
              setNotice(null);
            }}
            className={
              "h-9 flex-1 rounded-sm text-[13px] font-medium transition-colors duration-ui " +
              (mode === m
                ? "bg-slate/80 text-paper"
                : "text-fog hover:text-mist")
            }
          >
            {m === "login" ? "Masuk" : "Daftar"}
          </button>
        ))}
      </div>

      <form action={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nama@email.com"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder={mode === "register" ? "Minimal 8 karakter" : "Password"}
            required
          />
        </div>

        {error && (
          <p role="alert" className="text-[13px] text-danger">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-[13px] text-success">
            {notice}
          </p>
        )}

        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Memproses..." : mode === "login" ? "Masuk" : "Buat akun"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate" />
        <span className="text-xs text-ash">atau</span>
        <span className="h-px flex-1 bg-slate" />
      </div>

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={onGoogle}
        disabled={pending}
      >
        Lanjutkan dengan Google
      </Button>
    </div>
  );
}
