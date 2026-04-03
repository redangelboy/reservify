"use client";
import { useState, useEffect } from "react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SchedulePage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [form, setForm] = useState({ startTime: "09:00", endTime: "18:00" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchData = async () => {
    const [staffRes, schedRes] = await Promise.all([
      fetch("/api/staff"),
      fetch("/api/schedule"),
    ]);
    const staffData = await staffRes.json();
    const schedData = await schedRes.json();
    if (Array.isArray(staffData.staff)) setStaff(staffData.staff);
    else if (Array.isArray(staffData)) setStaff(staffData);
    if (Array.isArray(schedData)) setSchedules(schedData);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleStaff = (id: string) => {
    setSelectedStaff(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(x => x !== day) : [...prev, day]);
  };

  const toggleAllStaff = () => {
    setSelectedStaff(selectedStaff.length === staff.length ? [] : staff.map(s => s.id));
  };

  const toggleAllDays = () => {
    setSelectedDays(selectedDays.length === 7 ? [] : [0, 1, 2, 3, 4, 5, 6]);
  };

  const handleAdd = async () => {
    if (selectedStaff.length === 0) { setError("Select at least one staff member"); return; }
    if (selectedDays.length === 0) { setError("Select at least one day"); return; }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const promises = [];
      for (const staffId of selectedStaff) {
        for (const dayOfWeek of selectedDays) {
          promises.push(fetch("/api/schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ staffId, dayOfWeek: String(dayOfWeek), ...form }),
          }));
        }
      }
      await Promise.all(promises);
      setSuccess(`✓ Schedule saved for ${selectedStaff.length} staff × ${selectedDays.length} days`);
      setSelectedStaff([]);
      setSelectedDays([]);
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
          Set working hours for each staff member. Times are US Central (America/Chicago).
        </p>
        <div className="border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="font-semibold mb-4">Add working hours</h2>
          <div className="flex flex-col gap-4">

            {/* Staff selector */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-400">Staff members</label>
                <button onClick={toggleAllStaff} className="text-xs text-green-400 hover:text-green-300 transition">
                  {selectedStaff.length === staff.length ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {staff.map((s) => (
                  <button key={s.id} onClick={() => toggleStaff(s.id)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition border ${
                      selectedStaff.includes(s.id)
                        ? "bg-white text-black border-white"
                        : "bg-white/5 text-gray-400 border-white/10 hover:border-white/30"
                    }`}>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Day selector */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-400">Days</label>
                <button onClick={toggleAllDays} className="text-xs text-green-400 hover:text-green-300 transition">
                  {selectedDays.length === 7 ? "Deselect all" : "Select all"}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day, i) => (
                  <button key={i} onClick={() => toggleDay(i)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition border ${
                      selectedDays.includes(i)
                        ? "bg-white text-black border-white"
                        : "bg-white/5 text-gray-400 border-white/10 hover:border-white/30"
                    }`}>
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Time range */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">Start time</label>
                <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30 transition" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">End time</label>
                <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30 transition" />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-green-400 text-sm">{success}</p>}
            <button onClick={handleAdd} disabled={loading}
              className="bg-white text-black py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition disabled:opacity-50">
              {loading ? "Saving..." : `Save hours${selectedStaff.length > 0 && selectedDays.length > 0 ? ` (${selectedStaff.length} staff × ${selectedDays.length} days)` : ""}`}
            </button>
          </div>
        </div>

        {/* Current schedules */}
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
