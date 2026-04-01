"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function BookPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [business, setBusiness] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [form, setForm] = useState({ clientName: "", clientPhone: "", clientEmail: "" });
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/book?slug=${slug}`)
      .then(r => r.json())
      .then(data => setBusiness(data));
  }, [slug]);

  useEffect(() => {
    if (selectedStaff && selectedService && selectedDate) {
      fetch(`/api/book/availability?slug=${slug}&staffId=${selectedStaff.id}&serviceId=${selectedService.id}&date=${selectedDate}`)
        .then(r => r.json())
        .then(data => setSlots(data.slots || []));
    }
  }, [selectedStaff, selectedService, selectedDate]);

  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const handleBook = async () => {
    if (!form.clientName || !form.clientPhone) { setError("Name and phone are required"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          staffId: selectedStaff.id,
          serviceId: selectedService.id,
          date: selectedDate,
          time: selectedTime,
          ...form,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setConfirmed(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!business) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white animate-pulse">Loading...</div>
    </div>
  );

  if (confirmed) return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-white mb-2">Booking Confirmed!</h1>
        <p className="text-gray-400">Your appointment at {business.name} is confirmed.</p>
        <div className="mt-6 border border-white/10 rounded-2xl p-6 text-left max-w-sm mx-auto">
          <div className="text-sm text-gray-400 space-y-2">
            <div><span className="text-white font-medium">Service:</span> {selectedService?.name}</div>
            <div><span className="text-white font-medium">With:</span> {selectedStaff?.name}</div>
            <div><span className="text-white font-medium">Date:</span> {selectedDate}</div>
            <div><span className="text-white font-medium">Time:</span> {selectedTime}</div>
          </div>
        </div>
        <button onClick={() => { setConfirmed(false); setStep(1); setSelectedStaff(null); setSelectedService(null); setSelectedDate(""); setSelectedTime(""); }}
          className="mt-6 te-sm text-gray-400 hover:text-white transition">
          Book another appointment
        </button>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-lg mx-auto px-4 py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">{business.name}</h1>
          <p className="text-gray-400 text-sm mt-1">Book an appointment</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1,2,3,4].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${step >= s ? "bg-white text-black" : "bg-white/10 text-gray-500"}`}>{s}</div>
              {s < 4 && <div className={`w-8 h-px ${step > s ? "bg-white" : "bg-white/20"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Select Staff */}
        {step === 1 && (
          <div>
            <h2 className="font-semibold mb-4">Choose your barber</h2>
            <div className="flex flex-col gap-3">
              {business.staff.map((s: any) => (
                <button key={s.id} onClick={() => { setSelectedStaff(s); setStep(2); }}
                  className="border border-white/10 rounded-2xl px-6 py-4 text-left hover:border-white/40 transition flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{s.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Service */}
        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} className="text-gray-400 text-sm mb-4 hover:text-white transition">← Back</button>
          <h2 className="font-semibold mb-4">Choose a service</h2>
            <div className="flex flex-col gap-3">
              {business.services.map((s: any) => (
                <button key={s.id} onClick={() => { setSelectedService(s); setStep(3); }}
                  className="border border-white/10 rounded-2xl px-6 py-4 text-left hover:border-white/40 transition">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-sm text-gray-400 mt-1">${s.price} · {s.duration} min</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Select Date & Time */}
        {step === 3 && (
          <div>
            <button onClick={() => setStep(2)} className="text-gray-400 text-sm mb-4 hover:text-white transition">← Back</button>
            <h2 className="font-semibold mb-4">Choose date & time</h2>
            <div className="flgap-2 overflow-x-auto pb-2 mb-6">
              {getNext7Days().map((d) => {
                const dateStr = d.toISOString().split("T")[0];
                return (
                  <button key={dateStr} onClick={() => setSelectedDate(dateStr)}
                    className={`flex-shrink-0 w-14 rounded-xl py-3 text-center transition border ${selectedDate === dateStr ? "bg-white text-black border-white" : "border-white/10 hover:border-white/30"}`}>
                    <div className="text-xs">{DAYS[d.getDay()]}</div>
                    <div className="font-bold text-lg">{d.getDate()}</div>
                  </button>
                );
              })}
            </div>
            {selectedDate && (
              <>
                {slots.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No available slots for this day</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((slot) => (
                      <button key={slot} onClick={() => { setSelectedTime(slot); setStep(4); }}
                        className={`border rounded-xl py-3 text-sm font-medium transition ${selectedTime === slot ? "bg-white text-black border-white" : "border-white/10 hover:border-white/30"}`}>
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 4: Client Info */}
        {step === 4 && (
          <div>
            <button onClick={() => setStep(3)} className="text-gray-400 text-sm mb-4 hover:text-white transition">← Back</button>
            <h2 className="font-semibold mb-4">Your information</h2>
            <div className="border border-white/10 rounded-2xl p-4 mb-6 text-sm text-gray-400">
              <div>{selectedStaff?.name} · {selectedService?.name}</div>
              <div>{selectedDate} {selectedTime}</div>
            </div>
            <div className="flex flex-col gap-3">
              <input type="text" placeholder="Your name *" value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30 transition" />
              <input type="tel" placeholder="Phone number *" value={form.clientPhone}
                onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30 transition" />
              <input type="email" placeholder="Email (optional)" value={form.clientEmail}
                onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/30 transition" />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button onClick={handleBook} disabled={loading}
                className="bg-white text-black py-3 rounded-xl font-semibold text-sm hover:bg-gray-200 transition disabled:opacity-50 mt-2">
                {loading ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
