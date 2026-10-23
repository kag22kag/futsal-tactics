"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { Frame, PitchType, SavedTactic, UserProfile } from "@/types/tactics";
import { cloneFrame, parseTacticsJson } from "@/lib/tactics";

interface StoredAccount extends UserProfile {
  salt: string;
  passwordHash: string;
}

interface AccountContextValue {
  user: UserProfile | null;
  tactics: SavedTactic[];
  register: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  updateName: (name: string) => void;
  updatePassword: (current: string, next: string) => Promise<void>;
  saveTactic: (title: string, pitchType: PitchType, frames: Frame[]) => void;
  renameTactic: (id: string, title: string) => void;
  deleteTactic: (id: string) => void;
}

const AccountContext = createContext<AccountContextValue | null>(null);
const STORAGE = {
  accounts: "futsal:accounts:v1",
  session: "futsal:session:v1",
  tactics: "futsal:tactics:v1",
} as const;
const CHANGE_EVENT = "futsal:store-changed";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function getSnapshot(): string {
  try {
    return JSON.stringify([localStorage.getItem(STORAGE.accounts), localStorage.getItem(STORAGE.session), localStorage.getItem(STORAGE.tactics)]);
  } catch { return "[null,null,null]"; }
}

function notifyChange(): void { window.dispatchEvent(new Event(CHANGE_EVENT)); }

function readList<T>(key: string): T[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value as T[] : [];
  } catch {
    return [];
  }
}

function readAccounts(): StoredAccount[] {
  return readList<StoredAccount>(STORAGE.accounts).filter(account =>
    typeof account?.id === "string" && typeof account?.email === "string" &&
    typeof account?.name === "string" && typeof account?.salt === "string" &&
    typeof account?.passwordHash === "string",
  );
}

function readTactics(): SavedTactic[] {
  return readList<SavedTactic>(STORAGE.tactics).filter(tactic =>
    typeof tactic?.id === "string" && typeof tactic?.userId === "string" &&
    typeof tactic?.title === "string" && Array.isArray(tactic?.frames) &&
    (tactic?.pitchType === "full" || tactic?.pitchType === "half"),
  );
}

function writeList(key: string, value: unknown[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error("Không thể lưu trên thiết bị này. Hãy kiểm tra dung lượng trình duyệt.");
  }
}

function normalizeEmail(email: string): string {
  const value = email.trim().toLowerCase();
  if (value.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error("Email không hợp lệ.");
  }
  return value;
}

function validatePassword(password: string): void {
  if (password.length < 8) throw new Error("Mật khẩu cần ít nhất 8 ký tự.");
}

function validateTitle(title: string): string {
  const clean = title.trim();
  if (!clean || clean.length > 80) throw new Error("Tên bài đánh cần từ 1 đến 80 ký tự.");
  return clean;
}

function validateName(name: string): string {
  const clean = name.trim();
  if (!clean || clean.length > 50) throw new Error("Tên hiển thị cần từ 1 đến 50 ký tự.");
  return clean;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

// Demo cục bộ: lưu hash có salt thay vì mật khẩu gốc vào localStorage.
async function hashPassword(password: string, saltHex: string): Promise<string> {
  const salt = Uint8Array.from(saltHex.match(/.{2}/g) ?? [], byte => parseInt(byte, 16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const hash = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" }, key, 256);
  return toHex(new Uint8Array(hash));
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => "[]");
  let user: UserProfile | null = null;
  let tactics: SavedTactic[] = [];
  if (snapshot !== "[]") {
    try {
      const id = localStorage.getItem(STORAGE.session);
      const account = readAccounts().find(item => item.id === id);
      if (account) {
        user = { id: account.id, email: account.email, name: account.name };
        tactics = readTactics().filter(item => item.userId === account.id);
      }
    } catch { /* Chế độ riêng tư có thể chặn truy cập storage. */ }
  }

  async function register(email: string, password: string) {
    const normalized = normalizeEmail(email);
    validatePassword(password);
    const accounts = readAccounts();
    if (accounts.some(account => account.email === normalized)) throw new Error("Email này đã được đăng ký.");
    const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
    const account: StoredAccount = {
      id: crypto.randomUUID(), email: normalized,
      name: validateName(normalized.split("@")[0] ?? "Người dùng"),
      salt, passwordHash: await hashPassword(password, salt),
    };
    writeList(STORAGE.accounts, [...accounts, account]);
    localStorage.setItem(STORAGE.session, account.id);
    notifyChange();
  }

  async function signIn(email: string, password: string) {
    const normalized = normalizeEmail(email);
    const account = readAccounts().find(item => item.email === normalized);
    if (!account || await hashPassword(password, account.salt) !== account.passwordHash) {
      throw new Error("Email hoặc mật khẩu không đúng.");
    }
    localStorage.setItem(STORAGE.session, account.id);
    notifyChange();
  }

  function signOut() {
    localStorage.removeItem(STORAGE.session);
    notifyChange();
  }

  function updateName(name: string) {
    if (!user) throw new Error("Bạn cần đăng nhập.");
    const clean = validateName(name);
    writeList(STORAGE.accounts, readAccounts().map(item => item.id === user.id ? { ...item, name: clean } : item));
    notifyChange();
  }

  async function updatePassword(current: string, next: string) {
    if (!user) throw new Error("Bạn cần đăng nhập.");
    const accounts = readAccounts();
    const account = accounts.find(item => item.id === user.id);
    if (!account || await hashPassword(current, account.salt) !== account.passwordHash) {
      throw new Error("Mật khẩu hiện tại không đúng.");
    }
    validatePassword(next);
    const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
    const passwordHash = await hashPassword(next, salt);
    writeList(STORAGE.accounts, accounts.map(item => item.id === user.id ? { ...item, salt, passwordHash } : item));
    notifyChange();
  }

  function saveTactic(title: string, pitchType: PitchType, frames: Frame[]) {
    if (!user) throw new Error("Đăng nhập để lưu bài đánh.");
    const clean = validateTitle(title);
    const document = parseTacticsJson(JSON.stringify({
      format: "futsal-tactics", version: 2, pitchType, currentFrameIndex: 0, frames,
    }));
    const item: SavedTactic = {
      id: crypto.randomUUID(), userId: user.id, title: clean, pitchType,
      frames: document.frames.map(frame => cloneFrame(frame, frame.id)),
      createdAt: new Date().toISOString(),
    };
    writeList(STORAGE.tactics, [item, ...readTactics()]);
    notifyChange();
  }

  function renameTactic(id: string, title: string) {
    if (!user) throw new Error("Bạn cần đăng nhập.");
    const clean = validateTitle(title);
    writeList(STORAGE.tactics, readTactics().map(item =>
      item.id === id && item.userId === user.id ? { ...item, title: clean } : item,
    ));
    notifyChange();
  }

  function deleteTactic(id: string) {
    if (!user) throw new Error("Bạn cần đăng nhập.");
    writeList(STORAGE.tactics, readTactics().filter(item => !(item.id === id && item.userId === user.id)));
    notifyChange();
  }

  if (snapshot === "[]") return <div className="flex flex-1 items-center justify-center bg-slate-950 text-sm text-slate-400">Đang mở sa bàn...</div>;

  return <AccountContext.Provider value={{ user, tactics, register, signIn, signOut, updateName, updatePassword, saveTactic, renameTactic, deleteTactic }}>
    {children}
  </AccountContext.Provider>;
}

export function useAccount(): AccountContextValue {
  const context = useContext(AccountContext);
  if (!context) throw new Error("Thiếu AccountProvider.");
  return context;
}
