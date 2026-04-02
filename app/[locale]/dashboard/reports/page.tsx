"use client";
import { useState, useEffect } from "react";

export default function ReportsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/appointments/consolidated")
      .then(async (r) => {
        const data = await r.json();
        if (r.status === 403) {
          throw new Error("Switch to your main business (location switcher) to view consolidated reports.");
        }
        if (!r.ok) throw new Error(data.error || "Failed to load");
        setRows(data.appointments || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/10 px-8 py-4 flex items-center gap-4">
        <a href="/en/dashboard" className="text-gray-400 hover:text-white transition text-sm">← Dashboard</a>
        <span className="text-white font-semibold">Consolidated reports</span>
      </nav>
      <div className="max-w-5xl mx-auto px-8 py-10">
        <h1 className="text-2xl font-bold mb-2">Today across all locations</h1>
        <p className="text-gray-400 text-sm mb-8">Appointments scheduled for today at every active location.</p>
        {loading && <p className="text-gray-500 text-sm">Loading…</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {!loading && !error && rows.length === 0 && (
          <div className="border border-white/10 rounded-2xl p-8 text-center text-gray-400 text-sm">No appointments today.</div>
        )}
        {!loading && rows.length > 0 && (
          <div className="flex flex-col gap-2">
            {rows.map((apt) => (
              <div key={apt.id} className="border border-white/10 rounded-xl px-4 py-3 flex flex-wrap justify-between gap-2 text-sm">
                <span className="text-gray-500">{apt.business?.name ?? "Location"}</span>
                <span className="font-mono text-green-400">{formatTime(apt.date)}</span>
                <span>{apt.clientName}</span>
                <span className="text-gray-400">{apt.service?.name} · {apt.staff?.name}</span>
                <span className="text-green-400">${apt.service?.price}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
