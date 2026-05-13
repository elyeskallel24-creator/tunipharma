import { useEffect, useState } from "react";

const KEY = "tunipharma-admin-token";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}

export function setAdminToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(KEY, token);
  else localStorage.removeItem(KEY);
}

export function useAdminToken() {
  const [token, setTok] = useState<string | null>(null);
  useEffect(() => {
    setTok(getAdminToken());
    const onStorage = () => setTok(getAdminToken());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return [token, (t: string | null) => { setAdminToken(t); setTok(t); }] as const;
}
