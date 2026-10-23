"use client";

import { useState, type FormEvent } from "react";
import { FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import type { SavedTactic } from "@/types/tactics";
import { useAccount } from "@/context/AccountContext";
import ModalShell from "@/components/auth/ModalShell";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (title: string) => void;
  onLoad: (tactic: SavedTactic) => void;
  onRequireAuth: () => void;
}

const button = "rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:border-emerald-400 hover:text-emerald-300";

export default function MyTacticsModal({ open, onClose, onSave, onLoad, onRequireAuth }: Props) {
  const { user, tactics, renameTactic, deleteTactic } = useAccount();
  const [title, setTitle] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [error, setError] = useState("");

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (!user) { onRequireAuth(); return; }
    try { onSave(title); setTitle(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể lưu bài đánh."); }
  }

  function rename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (!renamingId) return;
    try { renameTactic(renamingId, renameValue); setRenamingId(null); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể đổi tên."); }
  }

  function remove(id: string) {
    if (!window.confirm("Xóa bài đánh này khỏi kho cá nhân?")) return;
    try { deleteTactic(id); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể xóa bài đánh."); }
  }

  return <ModalShell open={open} onClose={onClose} title="Chiến thuật của tôi">
    <div className="space-y-5 p-5 sm:p-6">
      {user ? <form onSubmit={save} className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/70 p-4">
        <label className="block text-sm font-semibold" htmlFor="tactic-title">Lưu bài đánh hiện tại</label>
        <div className="flex flex-wrap gap-2">
          <input id="tactic-title" required maxLength={80} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ví dụ: Phản công 3v2" className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm outline-none focus:border-emerald-400" />
          <button type="submit" className="flex min-h-11 items-center gap-1 rounded-lg bg-emerald-400 px-3 text-xs font-bold text-slate-950 hover:bg-emerald-300"><Plus size={16} /> Lưu bài đánh</button>
        </div>
      </form> : <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-4 text-sm text-slate-300">
        Đăng nhập để lưu và quản lý bài đánh. <button type="button" onClick={onRequireAuth} className="ml-2 font-semibold text-emerald-400 underline">Đăng nhập</button>
      </div>}

      {error && <p role="alert" className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{tactics.length} bài đánh đã lưu</p>
      {user && tactics.length === 0 && <p className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">Chưa có bài đánh nào. Lưu sa bàn hiện tại để bắt đầu.</p>}
      <div className="space-y-3">
        {tactics.map(tactic => <article key={tactic.id} className="rounded-xl border border-slate-700 bg-slate-950/60 p-4">
          {renamingId === tactic.id ? <form onSubmit={rename} className="flex gap-2">
            <input aria-label="Tên bài đánh mới" className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm" maxLength={80} required value={renameValue} onChange={e => setRenameValue(e.target.value)} />
            <button type="submit" className={button}>Lưu</button><button type="button" onClick={() => setRenamingId(null)} className={button}>Hủy</button>
          </form> : <h3 className="flex items-center gap-2 text-sm font-bold text-white"><FolderOpen size={16} className="text-emerald-400" />{tactic.title}</h3>}
          <p className="my-3 text-xs text-slate-400">{tactic.pitchType === "full" ? "Full Court" : "Half Court"} · {tactic.frames.length} frame · {new Date(tactic.createdAt).toLocaleDateString("vi-VN")}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={`${button} border-emerald-500/50 text-emerald-300`} onClick={() => { setError(""); try { onLoad(tactic); } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể nạp bài đánh."); } }}>Nạp vào Sa bàn</button>
            <button type="button" className={button} onClick={() => { setRenameValue(tactic.title); setRenamingId(tactic.id); }}><span className="flex items-center gap-1"><Pencil size={13} /> Đổi tên</span></button>
            <button type="button" className={`${button} hover:border-rose-400 hover:text-rose-300`} onClick={() => remove(tactic.id)}><span className="flex items-center gap-1"><Trash2 size={13} /> Xóa</span></button>
          </div>
        </article>)}
      </div>
      <p className="text-xs text-slate-500">Dữ liệu chỉ ở trình duyệt này. Xuất JSON để sao lưu hoặc chuyển thiết bị.</p>
    </div>
  </ModalShell>;
}
