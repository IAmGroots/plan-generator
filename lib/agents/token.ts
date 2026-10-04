/**
 * Token agent per proyek.
 *
 * AI coding agent tidak punya sesi cookie user, jadi ia melapor lewat
 * endpoint /api/agent dengan token proyek. Token dibuat sekali secara
 * otomatis (saat user pertama membuka halaman export) dan tetap dipakai
 * seterusnya — tidak berubah-ubah, agar agent yang sedang berjalan tidak
 * kehilangan akses.
 *
 * Implementasi memakai Web Crypto (tersedia di runtime Node Next.js 16),
 * tanpa dependensi tambahan.
 */

const TOKEN_PREFIX = "pf_";

/** Hasilkan token acak (plaintext) yang aman, mis. "pf_xxx...". */
export function generateAgentToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${TOKEN_PREFIX}${hex}`;
}

/**
 * Bandingkan token plaintext dari agent dengan token tersimpan, memakai
 * perbandingan waktu-konstan sederhana untuk mengurangi timing attack.
 */
export function verifyAgentToken(
  token: string,
  storedToken: string | null | undefined,
): boolean {
  if (!storedToken) return false;
  return timingSafeEqual(token, storedToken);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
