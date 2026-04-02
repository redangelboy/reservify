"use client";
import { useState, useEffect } from "react";
import { isMainBusinessFromPayload } from "@/lib/main-business";

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [isMain, setIsMain] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchAll = async () => {
    const [staffRes, locRes, bizRes] = await Promise.all([
      fetch("/api/staff"),
      fetch("/api/business/locations"),
      fetch("/api/business"),
    ]);
    const staffData = await staffRes.json();
    const locData = await locRes.json();
    const biz = await bizRes.json();
    if (Array.isArray(staffData)) setStaff(staffData);
    if (Array.isArray(locData)) setLocations(locData);
    if (biz?.id) {
      setIsMain(isMainBusinessFromPayload(biz));
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const branchLocations = locations.filter((loc) => {
    const ls = loc.locationSlug;
    if (ls == null) return false;
    const t = String(ls).trim();
    return t !== "" && t !== "main";
  });

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
      fetchAll();
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
    fetchAll();
  };

  const toggleLocation = async (staffId: string, locationId: string, checked: boolean) => {
    setError("");
    try {
      if (checked) {
        const res = await fetch("/api/staff/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ staffId, businessId: locationId, active: true }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      } else {
        const res = await fetch("/api/staff/assign", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ staffId, businessId: locationId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      }
      fetchAll();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/10 px-8 py-4 flex items-center gap-4">
        <a href="/en/dashboard" className="text-gray-400 hover:text-white transition text-sm">
          ← Dashboard
        </a>
        <span className="text-white font-semibold">{isMain ? "Staff" : "Assigned staff"}</span>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-10">
        <h1 className="text-2xl font-bold mb-2">{isMain ? "Manage staff" : "Assigned staff"}</h1>
        <p className="text-gray-400 text-sm mb-8">
          {isMain
            ? "Staff are shared across locations. Assign each person to the locations where they work."
            : "Read-only list for this location. Use the location menu and switch to your main business to add, remove, or assign staff."}
        </p>

        {isMain && (
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
          </div>
        )}

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="flex flex-col gap-3">
          {staff.length === 0 ? (
            <div className="border border-white/10 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">👤</div>
              <p className="text-gray-400 text-sm">No staff members yet</p>
            </div>
          ) : (
            staff.map((s) => (
              <div key={s.id} className="border border-white/10 rounded-2xl px-6 py-4 hover:border-white/20 transition">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{s.name}</span>
                  </div>
                  {isMain && (
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-gray-600 hover:text-red-400 transition text-sm shrink-0"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {isMain && branchLocations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-gray-500 mb-2">Locations</p>
                    <div className="flex flex-wrap gap-3">
                      {branchLocations.map((loc) => {
                        const ids: string[] = s.assignedLocationIds || [];
                        const checked = ids.includes(loc.id);
                        return (
                          <label key={loc.id} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => toggleLocation(s.id, loc.id, e.target.checked)}
                              className="rounded border-white/20"
                            />
                            {loc.name}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
