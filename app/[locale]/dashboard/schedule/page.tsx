"use client";
import { useState, useEffect } from "react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SchedulePage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [form, setForm] = useState({ dayOfWeek: "1", startTime: "09:00", endTime: "18:00" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    const [staffRes, schedRes] = await Promise.all([
      fetch("/api/staff"),
      fetch("/api/schedule"),
    ]);
    const staffData = await staffRes.json();
    const schedData = await schedRes.json();
    if (Array.isArray(staffData)) setStaff(staffData);
    if (Array.isArray(schedData)) setSchedules(schedData);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    if (!selectedStaff) { setError("Select a staff member"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: selectedStaff, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/schedule", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchData();
  };

  const byStaff = staff.map((s) => ({
    ...s,
    schedules: schedules.filter((sc) => sc.staffId === s.id).sort((a, b) => a.dayOfWeek - b.dayOfWeek),
  }));

  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/10 px-8 py-4 flex items-center gap-4">
        <a href="/en/dashboard" className="text-gray-400 hover:text-white transition text-sm">← Dashboard</a>
        <span className="text-white font-semibold">Schedule</span>
      </nav>
      <div className="max-w-3xl mx-auto px-8 py-10">
        <h1 className="text-2xl font-bold mb-2">Manage Schedule</h1>
        <p className="text-gray-400 text-sm mb-8">
          Set working hours for each staff member. Times are US Central (America/Chicago — CST/CDT).
        </p>
        <div className="border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="font-semibold mb-4">Add working hours</h2>
          <div className="flex flex-col gap-3">
            <select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30 transition">
              <option value="">Select staff member</option>
              {staff.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
            <select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30 transition">
              {DAYS.map((day, i) => (<option key={i} value={i}>{day}</option>))}
            </select>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">Start time</label>
                <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30 transition" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">End time</label>
                <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30 transition" />
              </div>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button onClick={handleAdd} disabled={loading} className="bg-white text-black py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition disabled:opacity-50">
              {loading ? "Saving..." : "Save hours"}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-6">
          {byStaff.map((s) => (
            <div key={s.id} className="border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold">{s.name.charAt(0).toUpperCase()}</div>
                <span className="font-semibold">{s.name}</span>
                <span className="text-xs text-gray-500">{s.schedules.length} days</span>
              </div>
              {s.schedules.length === 0 ? (
                <p className="text-gray-600 text-sm">No hours set yet</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {s.schedules.map((sc: any) => (
                    <div key={sc.id} className="flex justify-between items-center bg-white/5 rounded-xl px-4 py-2">
                      <span className="text-sm font-medium w-24">{DAYS[sc.dayOfWeek]}</span>
                      <span className="text-sm text-gray-400">{sc.startTime} — {sc.endTime}</span>
                      <button onClick={() => handleDelete(sc.id)} className="text-gray-600 hover:text-red-400 transition text-xs">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
