"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Status = "pending" | "confirmed" | "cancelled";

interface Appointment {
  id: string;
  physicianName: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  date: string;
  time: string;
  reasonForVisit: string;
  status: Status;
  createdAt: string;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

const STATUS_CONFIG = {
  pending:   { label: "Pending",   cls: "badge-pending",   emoji: "⏳" },
  confirmed: { label: "Confirmed", cls: "badge-confirmed", emoji: "✅" },
  cancelled: { label: "Cancelled", cls: "badge-cancelled", emoji: "❌" },
};

export default function AdminPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [selected, setSelected] = useState<Appointment | null>(null);

  const load = useCallback(() => {
    fetch("/api/appointments")
      .then((r) => r.json())
      .then((data) => {
        setAppointments(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, status: Status) {
    setUpdating(id);
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
      if (selected?.id === id) setSelected(updated);
    }
    setUpdating(null);
  }

  const filtered = filter === "all"
    ? appointments
    : appointments.filter((a) => a.status === filter);

  const counts = {
    all: appointments.length,
    pending: appointments.filter((a) => a.status === "pending").length,
    confirmed: appointments.filter((a) => a.status === "confirmed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>

      {/* Top bar */}
      <div className="border-b px-6 py-4 flex items-center justify-between"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-3">
          <img src="/v-logo.svg" alt="Vero Icon" className="h-8 w-auto" />
          <span className="font-semibold text-sm" style={{ color: "var(--color-ink)" }}>| Clinic OS</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={load} className="text-sm hover:opacity-70 transition-opacity"
            style={{ color: "var(--color-ink-muted)" }}>
            ↻ Refresh
          </button>
          <Link href="/" className="text-sm hover:opacity-70 transition-opacity"
            style={{ color: "var(--color-ink-muted)" }}>
            ← Home
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 animate-fade-up">
          {(["all", "pending", "confirmed", "cancelled"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="rounded-2xl p-4 border text-left transition-all hover:shadow-sm"
              style={{
                background: filter === s ? (s === "all" ? "var(--color-ink)" : "var(--color-surface)") : "var(--color-surface)",
                borderColor: filter === s ? (s === "all" ? "var(--color-ink)" : "var(--color-accent)") : "var(--color-border)",
                color: filter === s && s === "all" ? "white" : "var(--color-ink)",
              }}
            >
              <div className="text-2xl font-bold font-display">{counts[s]}</div>
              <div className="text-xs mt-0.5 capitalize"
                style={{ color: filter === s && s === "all" ? "rgba(255,255,255,0.7)" : "var(--color-ink-muted)" }}>
                {s === "all" ? "Total appointments" : s}
              </div>
            </button>
          ))}
        </div>

        {/* Table / empty */}
        {loading ? (
          <div className="text-center py-20" style={{ color: "var(--color-ink-muted)" }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">📭</div>
            <p style={{ color: "var(--color-ink-muted)" }}>
              {filter === "all" ? "No appointments yet." : `No ${filter} appointments.`}
            </p>
          </div>
        ) : (
          <div className="animate-fade-up grid gap-3">
            {filtered.map((apt, i) => {
              const sc = STATUS_CONFIG[apt.status];
              return (
                <div
                  key={apt.id}
                  onClick={() => setSelected(apt)}
                  className="rounded-2xl border p-5 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 animate-fade-up"
                  style={{
                    background: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                    animationDelay: `${i * 0.04}s`,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-sm" style={{ color: "var(--color-ink)" }}>
                          {apt.patientName}
                        </span>
                        <span className={`${sc.cls} text-xs font-medium px-2 py-0.5 rounded-full`}>
                          {sc.emoji} {sc.label}
                        </span>
                      </div>
                      <div className="text-xs mb-1" style={{ color: "var(--color-ink-muted)" }}>
                        {apt.physicianName} · {formatDate(apt.date)} at {formatTime(apt.time)}
                      </div>
                      <p className="text-xs truncate max-w-md" style={{ color: "var(--color-ink-muted)" }}>
                        {apt.reasonForVisit}
                      </p>
                    </div>

                    {/* Quick actions */}
                    <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {apt.status !== "confirmed" && apt.status !== "cancelled" && (
                        <button
                          onClick={() => updateStatus(apt.id, "confirmed")}
                          disabled={updating === apt.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                          style={{ background: "var(--color-accent)" }}
                        >
                          Confirm
                        </button>
                      )}
                      {apt.status !== "cancelled" && (
                        <button
                          onClick={() => updateStatus(apt.id, "cancelled")}
                          disabled={updating === apt.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90 disabled:opacity-50"
                          style={{ background: "var(--color-cancelled-bg)", color: "var(--color-cancelled)" }}
                        >
                          Cancel
                        </button>
                      )}
                      {apt.status === "cancelled" && (
                        <button
                          onClick={() => updateStatus(apt.id, "pending")}
                          disabled={updating === apt.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-90 disabled:opacity-50"
                          style={{ background: "var(--color-pending-bg)", color: "var(--color-pending)" }}
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setSelected(null)}>
          <div className="flex-1" />
          <div
            className="w-full sm:w-96 h-full overflow-y-auto shadow-2xl p-6 animate-fade-up"
            style={{ background: "var(--color-surface)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl" style={{ color: "var(--color-ink)" }}>
                Appointment details
              </h2>
              <button onClick={() => setSelected(null)} className="text-lg hover:opacity-60">✕</button>
            </div>

            <div className="space-y-4 text-sm">
              <DetailRow label="Patient" value={selected.patientName} />
              <DetailRow label="Email" value={selected.patientEmail} />
              {selected.patientPhone && <DetailRow label="Phone" value={selected.patientPhone} />}
              <DetailRow label="Physician" value={selected.physicianName} />
              <DetailRow label="Date" value={formatDate(selected.date)} />
              <DetailRow label="Time" value={formatTime(selected.time)} />
              <DetailRow label="Status">
                <span className={`${STATUS_CONFIG[selected.status].cls} text-xs font-semibold px-2 py-0.5 rounded-full`}>
                  {STATUS_CONFIG[selected.status].emoji} {STATUS_CONFIG[selected.status].label}
                </span>
              </DetailRow>
              <div>
                <div className="font-medium mb-1" style={{ color: "var(--color-ink-muted)" }}>Reason for visit</div>
                <p className="leading-relaxed" style={{ color: "var(--color-ink)" }}>{selected.reasonForVisit}</p>
              </div>
              <DetailRow label="Booking ID">
                <code className="text-xs break-all" style={{ color: "var(--color-ink-muted)" }}>{selected.id}</code>
              </DetailRow>
            </div>

            {/* Actions in drawer */}
            <div className="mt-8 flex flex-col gap-2">
              {selected.status !== "confirmed" && selected.status !== "cancelled" && (
                <button
                  onClick={() => updateStatus(selected.id, "confirmed")}
                  disabled={updating === selected.id}
                  className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--color-accent)" }}
                >
                  ✅ Confirm appointment
                </button>
              )}
              {selected.status !== "cancelled" && (
                <button
                  onClick={() => updateStatus(selected.id, "cancelled")}
                  disabled={updating === selected.id}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--color-cancelled-bg)", color: "var(--color-cancelled)" }}
                >
                  ❌ Cancel appointment
                </button>
              )}
              {selected.status === "cancelled" && (
                <button
                  onClick={() => updateStatus(selected.id, "pending")}
                  disabled={updating === selected.id}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--color-pending-bg)", color: "var(--color-pending)" }}
                >
                  ↩ Restore to pending
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, children }: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs font-medium mb-0.5" style={{ color: "var(--color-ink-muted)" }}>{label}</div>
      {children || <div style={{ color: "var(--color-ink)" }}>{value}</div>}
    </div>
  );
}