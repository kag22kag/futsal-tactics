import { Goal, Sparkles } from "lucide-react";
import TacticalBoard from "@/components/board/TacticalBoard";
import ConnectionStatus from "@/components/ConnectionStatus";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-emerald-400 p-2.5 text-slate-950"><Goal size={26} aria-hidden="true" /></span>
            <div><h1 className="text-lg font-bold tracking-tight sm:text-xl">Futsal Tactics <span className="text-emerald-400">Pro</span></h1><p className="text-xs text-slate-400">Sa bàn chiến thuật • 5 vs 5</p></div>
          </div>
          <ConnectionStatus />
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-2 py-6 sm:px-6 sm:py-8">
        <div className="mb-5 px-2 sm:px-0">
          <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-emerald-400"><Sparkles size={15} /> Không gian huấn luyện</p>
          <h2 className="text-2xl font-semibold">Biến ý tưởng thành chuyển động.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Kéo thả cầu thủ, vẽ đường chuyền và diễn tập từng khung hình. Xoay ngang điện thoại để thao tác dễ hơn.</p>
        </div>
        <TacticalBoard />
        <footer className="px-2 py-6 text-xs leading-6 text-slate-500">Dữ liệu đang nằm trong phiên trình duyệt. Tải JSON để lưu bài trước khi đóng hoặc tải lại trang.</footer>
      </div>
    </main>
  );
}
