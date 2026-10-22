"use client";
import { useSyncExternalStore } from "react";
import { Wifi, WifiOff } from "lucide-react";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}
export default function ConnectionStatus() {
  // Trạng thái mạng do trình duyệt báo, không phải trạng thái đồng bộ cloud.
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, (): boolean | null => null);
  const Icon = online === false ? WifiOff : Wifi;
  return <span role="status" className="inline-flex items-center gap-2 text-xs text-slate-300"><Icon size={16} className={online === false ? "text-amber-400" : "text-emerald-400"} />{online === null ? "Kiểm tra mạng…" : online ? "Có kết nối mạng" : "Mất kết nối mạng"}</span>;
}
