"use client";
import { useState, useEffect } from "react";

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", price: "", duration: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchServices = async () => {
    const res = await fetch("/api/services");
    const data = await res.json();
    if (Array.isArray(data)) setServices(data);
  };

  useEffect(() => { fetchServices(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.price || !form.duration) {
      setError("All fields are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm({ name: "", price: "", duration: "" });
      fetchServices();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/services", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchServices();
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/10 px-8 py-4 flex items-center gap-4">
        <a href="/en/dashboard" className="text-gray-400 hover:text-white transition text-sm">
          ← Dashboard
        </a>
        <span className="text-white font-semibold">Services</span>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-10">
        <h1 className="text-2xl font-bold mb-2">Manage Services</h1>
        <p className="text-gray-400 text-sm mb-8">Add the services your business offers with pricing and duration.</p>

        {/* Add service */}
        <div className="border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="font-semibold mb-4">Add new service</h2>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Service name (e.g. Haircut)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30 transition"
            />
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-3 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  placeholder="Price"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm outline-none focus:border-white/30 transition"
                />
              </div>
              <div className="flex-1 relative">
                <input
                  type="number"
                  placeholder="Duration (min)"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30 transition"
                />
              </div>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={handleAdd}
              disabled={loading}
              className="bg-white text-black py-3 rounded-xl text-sm font-semibold hover:bg-gray-200 transition disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add service"}
            </button>
          </div>
        </div>

        {/* Services list */}
        <div className="flex flex-col gap-3">
          {services.length === 0 ? (
            <div className="border border-white/10 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">✂️</div>
              <p className="text-gray-400 text-sm">No services yet</p>
              <p className="text-gray-600 text-xs mt-1">Add your first service above</p>
            </div>
          ) : (
            services.map((s) => (
              <div key={s.id} className="border border-white/10 rounded-2xl px-6 py-4 flex justify-between items-center hover:border-white/20 transition">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    ${s.price} · {s.duration} min
                  </div>
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