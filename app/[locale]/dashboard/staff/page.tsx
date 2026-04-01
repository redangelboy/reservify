"use client";
import { useState, useEffect } from "react";

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchStaff = async () => {
    const res = await fetch("/api/staff");
    const data = await res.json();
    if (Array.isArray(data)) setStaff(data);
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setName("");
      fetchStaff();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/staff", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchStaff();
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/10 px-8 py-4 flex items-center gap-4">
        <a href="/en/dashboard" className="text-gray-400 hover:text-white transition text-sm">
          ← Dashboard
        </a>
        <span className="text-white font-semibold">Staff</span>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-10">
        <h1 className="text-2xl font-bold mb-2">Manage Staff</h1>
        <p className="text-gray-400 text-sm mb-8">Add the people who provide services at your business.</p>

        {/* Add staff */}
        <div className="border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="font-semibold mb-4">Add new staff member</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Staff member name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30 transition"
            />
            <button
              onClick={handleAdd}
              disabled={loading}
              className="bg-white text-black px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add"}
            </button>
          </div>
          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
        </div>

        {/* Staff list */}
        <div className="flex flex-col gap-3">
          {staff.length === 0 ? (
            <div className="border border-white/10 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">👤</div>
              <p className="text-gray-400 text-sm">No staff members yet</p>
              <p className="text-gray-600 text-xs mt-1">Add your first staff member above</p>
            </div>
          ) : (
            staff.map((s) => (
              <div key={s.id} className="border border-white/10 rounded-2xl px-6 py-4 flex justify-between items-center hover:border-white/20 transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{s.name}</span>
                </div>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-gray-600 hover:text-red-400 transition text-sm"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}