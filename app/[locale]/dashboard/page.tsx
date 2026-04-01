"use client";
import { useState, useEffect } from "react";

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Por ahorita leemos la cookie de sesión via API
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => setSession(data))
      .catch(() => (window.location.href = "/en/login"));
  }, []);

  if (!session) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-sm animate-pulse">Loading...</div>
    </div>
  );

  return (
    <main className="min-h-screen bg-black text-white">

      {/* Top nav */}
      <nav className="border-b border-white/10 px-8 py-4 flex justify-between items-center">
        <span className="font-bold text-lg">Reservify</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{session.businessName}</span>
          <button
            onClick={() => {
              fetch("/api/auth/logout", { method: "POST" })
                .then(() => window.location.href = "/en/login");
            }}
            className="text-sm text-gray-400 hover:text-white transition"
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-10">

        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold">Good morning 👋</h1>
          <p className="text-gray-400 mt-1">Here's what's happening with {session.businessName} today.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Today's appointments", value: "0", icon: "📅" },
            { label: "This week", value: "0", icon: "📊" },
            { label: "Total clients", value: "0", icon: "👥" },
            { label: "Revenue this month", value: "$0", icon: "💰" },
          ].map((stat) => (
            <div key={stat.label} className="border border-white/10 rounded-2xl p-5">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-4">Quick actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Add staff", icon: "👤", href: "/dashboard/staff" },
              { label: "Add service", icon: "✂️", href: "/dashboard/services" },
              { label: "Set schedule", icon: "🕐", href: "/dashboard/schedule" },
              { label: "View bookings", icon: "📋", href: "/dashboard/bookings" },
            ].map((action) => (
              <button
                key={action.label}
                className="border border-white/10 rounded-2xl p-5 text-left hover:border-white/30 transition"
              >
                <div className="text-2xl mb-2">{action.icon}</div>
                <div className="text-sm font-medium">{action.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Today's appointments */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Today's appointments</h2>
          <div className="border border-white/10 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-gray-400 text-sm">No appointments yet for today</p>
            <p className="text-gray-600 text-xs mt-1">Appointments will appear here once clients start booking</p>
          </div>
        </div>

      </div>
    </main>
  );
}