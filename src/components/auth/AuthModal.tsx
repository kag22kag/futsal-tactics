"use client";

import { useState, type FormEvent } from "react";
import { LogIn, UserPlus, Users } from "lucide-react";
import { useAccount } from "@/context/AccountContext";
import ModalShell from "./ModalShell";

interface Props { open: boolean; onClose: () => void }
type Tab = "login" | "register";

const field = "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-emerald-400";

export default function AuthModal({ open, onClose }: Props) {
  const { signIn, register } = useAccount();
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function close() { setError(""); setPassword(""); onClose(); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(""); setBusy(true);
    try {
      if (tab === "login") await signIn(email, password);
      else await register(email, password);
      close();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể đăng nhập. Hãy thử lại.");
    } finally { setBusy(false); }
  }

  return <ModalShell open={open} onClose={close} title="Tài khoản Sa bàn Futsal">
    <div className="space-y-5 p-5 sm:p-6">
      <div className="grid grid-cols-2 rounded-xl bg-slate-950 p-1" role="tablist" aria-label="Đăng nhập hoặc đăng ký">
        {(["login", "register"] as const).map(value => <button key={value} type="button" role="tab" aria-selected={tab === value}
          onClick={() => { setTab(value); setError(""); }}
          className={`min-h-11 rounded-lg text-sm font-semibold ${tab === value ? "bg-emerald-400 text-slate-950" : "text-slate-400 hover:text-white"}`}>
          {value === "login" ? "Đăng nhập" : "Đăng ký"}
        </button>)}
      </div>
      <p className="text-sm text-slate-400">Lưu và quản lý bài đánh trên trình duyệt đang dùng.</p>
      <form onSubmit={submit} className="space-y-4">
        <label className="block space-y-2 text-sm text-slate-300">Email
          <input className={field} type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="ban@example.com" />
        </label>
        <label className="block space-y-2 text-sm text-slate-300">Mật khẩu
          <input className={field} type="password" autoComplete={tab === "login" ? "current-password" : "new-password"} required minLength={tab === "register" ? 8 : undefined} value={password} onChange={e => setPassword(e.target.value)} placeholder="Tối thiểu 8 ký tự khi đăng ký" />
        </label>
        {error && <p role="alert" className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
        <button disabled={busy} type="submit" className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 font-bold text-slate-950 hover:bg-emerald-300">
          {tab === "login" ? <LogIn size={18} /> : <UserPlus size={18} />}{busy ? "Đang xử lý..." : tab === "login" ? "Đăng nhập" : "Tạo tài khoản"}
        </button>
      </form>
      <div className="flex items-center gap-3 text-xs text-slate-500"><span className="h-px flex-1 bg-slate-700" /> hoặc <span className="h-px flex-1 bg-slate-700" /></div>
      <button type="button" onClick={close} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-700 text-sm text-slate-200 hover:bg-slate-800"><Users size={18} /> Tiếp tục với vai trò Khách</button>
      <p className="text-center text-xs leading-5 text-slate-500">Tài khoản demo chỉ lưu trên trình duyệt này. Dùng Xuất JSON để sao lưu bài quan trọng.</p>
    </div>
  </ModalShell>;
}
