"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, UserRound } from "lucide-react";
import { useAccount } from "@/context/AccountContext";
import ModalShell from "./ModalShell";

interface Props { open: boolean; onClose: () => void }
const field = "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400";

export default function UserProfileModal({ open, onClose }: Props) {
  const { user, updateName, updatePassword } = useAccount();
  const [tab, setTab] = useState<"profile" | "password">("profile");
  const [name, setName] = useState(user?.name ?? "");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function close() { setMessage(""); setCurrent(""); setNext(""); setConfirm(""); onClose(); }
  function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try { updateName(name); setMessage("Đã cập nhật tên hiển thị."); }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : "Không thể lưu tên."); }
  }
  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (next !== confirm) { setMessage("Hai mật khẩu mới không khớp."); return; }
    setBusy(true); setMessage("");
    try {
      await updatePassword(current, next);
      setCurrent(""); setNext(""); setConfirm("");
      setMessage("Đã cập nhật mật khẩu.");
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Không thể đổi mật khẩu."); }
    finally { setBusy(false); }
  }

  return <ModalShell open={open} onClose={close} title="Thông tin cá nhân">
    <div className="space-y-5 p-5 sm:p-6">
      <p className="text-sm text-slate-400">{user?.email}</p>
      <div role="tablist" className="grid grid-cols-2 rounded-xl bg-slate-950 p-1">
        <button type="button" role="tab" aria-selected={tab === "profile"} className={`flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm ${tab === "profile" ? "bg-slate-700 text-white" : "text-slate-400"}`} onClick={() => { setName(user?.name ?? ""); setMessage(""); setTab("profile"); }}><UserRound size={16} /> Hồ sơ</button>
        <button type="button" role="tab" aria-selected={tab === "password"} className={`flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm ${tab === "password" ? "bg-slate-700 text-white" : "text-slate-400"}`} onClick={() => { setMessage(""); setTab("password"); }}><KeyRound size={16} /> Mật khẩu</button>
      </div>
      {tab === "profile" ? <form onSubmit={saveName} className="space-y-4">
        <label className="block space-y-2 text-sm text-slate-300">Tên hiển thị
          <input className={field} value={name} onChange={event => setName(event.target.value)} placeholder={user?.name} maxLength={50} required />
        </label>
        <button className="min-h-11 w-full rounded-xl bg-emerald-400 font-semibold text-slate-950 hover:bg-emerald-300" type="submit">Lưu thay đổi</button>
      </form> : <form onSubmit={savePassword} className="space-y-4">
        <label className="block space-y-2 text-sm text-slate-300">Mật khẩu hiện tại<input type="password" autoComplete="current-password" required className={field} value={current} onChange={event => setCurrent(event.target.value)} /></label>
        <label className="block space-y-2 text-sm text-slate-300">Mật khẩu mới<input type="password" autoComplete="new-password" minLength={8} required className={field} value={next} onChange={event => setNext(event.target.value)} /></label>
        <label className="block space-y-2 text-sm text-slate-300">Xác nhận mật khẩu mới<input type="password" autoComplete="new-password" minLength={8} required className={field} value={confirm} onChange={event => setConfirm(event.target.value)} /></label>
        <button disabled={busy} className="min-h-11 w-full rounded-xl bg-emerald-400 font-semibold text-slate-950 hover:bg-emerald-300" type="submit">{busy ? "Đang xử lý..." : "Cập nhật mật khẩu"}</button>
      </form>}
      {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}
    </div>
  </ModalShell>;
}
