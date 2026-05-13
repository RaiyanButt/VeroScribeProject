"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────
interface Physician {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  avatar: string;
}

interface TimeSlot {
  id: string;
  physicianId: string;
  date: string;
  time: string;
  booked: boolean;
}

type Step = "physician" | "slot" | "details" | "confirmation";

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// ── Step indicator ─────────────────────────────────────────────────────────
const STEPS: { id: Step; label: string }[] = [
  { id: "physician", label: "Choose doctor" },
  { id: "slot", label: "Pick time" },
  { id: "details", label: "Your info" },
  { id: "confirmation", label: "Confirmed" },
];

function StepBar({ current }: { current: Step }) {
  const idx = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all"
              style={{
                background: i <= idx ? "var(--color-accent)" : "var(--color-border)",
                color: i <= idx ? "white" : "var(--color-ink-muted)",
              }}
            >
              {i < idx ? "✓" : i + 1}
            </div>
            <span className="text-xs mt-1 hidden sm:block"
              style={{ color: i === idx ? "var(--color-accent)" : "var(--color-ink-muted)" }}>
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="w-12 sm:w-20 h-0.5 mb-4 transition-all"
              style={{ background: i < idx ? "var(--color-accent)" : "var(--color-border)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function PatientPage() {
  const [step, setStep] = useState<Step>("physician");
  const [physicians, setPhysicians] = useState<Physician[]>([]);
  const [selectedPhysician, setSelectedPhysician] = useState<Physician | null>(null);
  const [slotsByDate, setSlotsByDate] = useState<Record<string, TimeSlot[]>>({});
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Record<string, string> | null>(null);

  // Form state
  const [form, setForm] = useState({
    patientName: "",
    patientEmail: "",
    patientPhone: "",
    reasonForVisit: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  // Load physicians on mount
  useEffect(() => {
    fetch("/api/physicians")
      .then((r) => r.json())
      .then(setPhysicians);
  }, []);

  // Load slots when physician selected
  useEffect(() => {
    if (!selectedPhysician) return;
    setLoading(true);
    fetch(`/api/physicians/${selectedPhysician.id}`)
      .then((r) => r.json())
      .then((data) => {
        setSlotsByDate(data);
        const firstDate = Object.keys(data).sort()[0];
        setSelectedDate(firstDate || "");
      })
      .finally(() => setLoading(false));
  }, [selectedPhysician]);

  function selectPhysician(p: Physician) {
    setSelectedPhysician(p);
    setSelectedSlot(null);
    setSelectedDate("");
    setStep("slot");
  }

  function selectSlot(slot: TimeSlot) {
    setSelectedSlot(slot);
    setStep("details");
  }

  function validateForm() {
    const e: Partial<typeof form> = {};
    if (!form.patientName.trim()) e.patientName = "Name is required";
    if (!form.patientEmail.trim()) e.patientEmail = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.patientEmail)) e.patientEmail = "Enter a valid email";
    if (!form.reasonForVisit.trim()) e.reasonForVisit = "Please describe your reason for visit";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm() || !selectedSlot) return;
    setSubmitting(true);

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId: selectedSlot.id, ...form }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (res.ok) {
      setConfirmedAppointment(data);
      setStep("confirmation");
    } else {
      alert(data.error || "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: "var(--color-bg)" }}>
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <Link href="/" className="text-sm flex items-center gap-1 mb-6 hover:opacity-70 transition-opacity"
            style={{ color: "var(--color-ink-muted)" }}>
            ← Back to home
          </Link>
          <h1 className="font-display text-4xl" style={{ color: "var(--color-ink)" }}>
            Book an Appointment
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--color-ink-muted)" }}>
            Choose your physician, pick a time, and we&apos;ll take care of the rest.
          </p>
        </div>

        <StepBar current={step} />

        {/* ── Step 1: Choose physician ── */}
        {step === "physician" && (
          <div className="animate-fade-up grid sm:grid-cols-2 gap-4">
            {physicians.map((p, i) => (
              <button
                key={p.id}
                onClick={() => selectPhysician(p)}
                className={`text-left rounded-2xl p-6 border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-fade-up`}
                style={{
                  background: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                  animationDelay: `${i * 0.06}s`,
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: "var(--color-accent)" }}>
                    {p.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: "var(--color-ink)" }}>{p.name}</div>
                    <div className="text-xs" style={{ color: "var(--color-accent)" }}>{p.specialty}</div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-ink-muted)" }}>{p.bio}</p>
                <div className="mt-4 text-xs font-medium" style={{ color: "var(--color-accent)" }}>
                  View availability →
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Step 2: Pick a slot ── */}
        {step === "slot" && selectedPhysician && (
          <div className="animate-fade-up">
            <button onClick={() => setStep("physician")} className="text-sm mb-6 flex items-center gap-1 hover:opacity-70"
              style={{ color: "var(--color-ink-muted)" }}>
              ← Change physician
            </button>

            <div className="rounded-2xl p-6 border mb-6"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: "var(--color-accent)" }}>
                  {selectedPhysician.avatar}
                </div>
                <div>
                  <div className="font-semibold" style={{ color: "var(--color-ink)" }}>{selectedPhysician.name}</div>
                  <div className="text-xs" style={{ color: "var(--color-accent)" }}>{selectedPhysician.specialty}</div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16" style={{ color: "var(--color-ink-muted)" }}>
                Loading available slots…
              </div>
            ) : Object.keys(slotsByDate).length === 0 ? (
              <div className="text-center py-16" style={{ color: "var(--color-ink-muted)" }}>
                No availability in the next 2 weeks.
              </div>
            ) : (
              <>
                {/* Date tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
                  {Object.keys(slotsByDate).sort().map((date) => (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium border transition-all"
                      style={{
                        background: selectedDate === date ? "var(--color-accent)" : "var(--color-surface)",
                        color: selectedDate === date ? "white" : "var(--color-ink)",
                        borderColor: selectedDate === date ? "var(--color-accent)" : "var(--color-border)",
                      }}
                    >
                      {formatDate(date)}
                    </button>
                  ))}
                </div>

                {/* Time grid */}
                {selectedDate && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {(slotsByDate[selectedDate] || []).map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => selectSlot(slot)}
                        className="px-3 py-3 rounded-xl text-sm font-medium border transition-all hover:shadow-sm hover:-translate-y-0.5"
                        style={{
                          background: "var(--color-surface)",
                          borderColor: "var(--color-border)",
                          color: "var(--color-ink)",
                        }}
                      >
                        {formatTime(slot.time)}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Step 3: Patient details ── */}
        {step === "details" && selectedPhysician && selectedSlot && (
          <div className="animate-fade-up">
            <button onClick={() => setStep("slot")} className="text-sm mb-6 flex items-center gap-1 hover:opacity-70"
              style={{ color: "var(--color-ink-muted)" }}>
              ← Change time
            </button>

            {/* Selected slot summary */}
            <div className="rounded-2xl p-5 border mb-6"
              style={{ background: "var(--color-accent-light)", borderColor: "#a7d7bc" }}>
              <div className="text-sm font-semibold" style={{ color: "var(--color-accent)" }}>Your appointment</div>
              <div className="mt-1 font-medium" style={{ color: "var(--color-ink)" }}>
                {selectedPhysician.name} · {formatDate(selectedSlot.date)} at {formatTime(selectedSlot.time)}
              </div>
            </div>

            {/* Form */}
            <div className="rounded-2xl p-6 border space-y-5"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>

              <Field label="Full name *" error={errors.patientName}>
                <input
                  type="text"
                  placeholder="Jane Smith"
                  value={form.patientName}
                  onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 text-sm border outline-none transition-all focus:ring-2"
                  style={{
                    borderColor: errors.patientName ? "#ef4444" : "var(--color-border)",
                    background: "var(--color-bg)",
                    color: "var(--color-ink)",
                  }}
                />
              </Field>

              <Field label="Email address *" error={errors.patientEmail}>
                <input
                  type="email"
                  placeholder="jane@example.com"
                  value={form.patientEmail}
                  onChange={(e) => setForm({ ...form, patientEmail: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 text-sm border outline-none transition-all focus:ring-2"
                  style={{
                    borderColor: errors.patientEmail ? "#ef4444" : "var(--color-border)",
                    background: "var(--color-bg)",
                    color: "var(--color-ink)",
                  }}
                />
              </Field>

              <Field label="Phone number" error={errors.patientPhone}>
                <input
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={form.patientPhone}
                  onChange={(e) => setForm({ ...form, patientPhone: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 text-sm border outline-none transition-all focus:ring-2"
                  style={{
                    borderColor: "var(--color-border)",
                    background: "var(--color-bg)",
                    color: "var(--color-ink)",
                  }}
                />
              </Field>

              <Field label="Reason for visit *" error={errors.reasonForVisit}>
                <textarea
                  rows={4}
                  placeholder="Briefly describe your symptoms or reason for visiting…"
                  value={form.reasonForVisit}
                  onChange={(e) => setForm({ ...form, reasonForVisit: e.target.value })}
                  className="w-full rounded-xl px-4 py-3 text-sm border outline-none transition-all focus:ring-2 resize-none"
                  style={{
                    borderColor: errors.reasonForVisit ? "#ef4444" : "var(--color-border)",
                    background: "var(--color-bg)",
                    color: "var(--color-ink)",
                  }}
                />
              </Field>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: "var(--color-accent)" }}
              >
                {submitting ? "Booking…" : "Request Appointment"}
              </button>

              <p className="text-xs text-center" style={{ color: "var(--color-ink-muted)" }}>
                Your appointment will be <strong>pending</strong> until confirmed by the physician&apos;s office.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 4: Confirmation ── */}
        {step === "confirmation" && confirmedAppointment && (
          <div className="animate-fade-up text-center max-w-md mx-auto">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="font-display text-3xl mb-2" style={{ color: "var(--color-ink)" }}>
              You&apos;re booked!
            </h2>
            <p className="text-sm mb-8" style={{ color: "var(--color-ink-muted)" }}>
              Your appointment request has been submitted. The office will confirm shortly.
            </p>

            <div className="rounded-2xl p-6 border text-left space-y-3 mb-8"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <Row label="Patient" value={confirmedAppointment.patientName} />
              <Row label="Physician" value={confirmedAppointment.physicianName} />
              <Row label="Date" value={formatDate(confirmedAppointment.date)} />
              <Row label="Time" value={formatTime(confirmedAppointment.time)} />
              <Row label="Status">
                <span className="badge-pending text-xs font-semibold px-2 py-0.5 rounded-full">
                  Pending confirmation
                </span>
              </Row>
              <Row label="Confirmation ID">
                <code className="text-xs" style={{ color: "var(--color-ink-muted)" }}>
                  {confirmedAppointment.id}
                </code>
              </Row>
            </div>

            <Link href="/" className="inline-block px-6 py-3 rounded-xl font-semibold text-sm text-white"
              style={{ background: "var(--color-accent)" }}>
              Back to home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Small reusable pieces ──────────────────────────────────────────────────

function Field({ label, error, children }: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-ink)" }}>
        {label}
      </label>
      {children}
      {error && <p className="text-xs mt-1 text-red-500">{error}</p>}
    </div>
  );
}

function Row({ label, value, children }: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span style={{ color: "var(--color-ink-muted)" }}>{label}</span>
      {children || <span style={{ color: "var(--color-ink)" }}>{value}</span>}
    </div>
  );
}
