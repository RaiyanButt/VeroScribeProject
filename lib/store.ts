// lib/store.ts
// In-memory store (persists for the lifetime of the Next.js dev server)
// In production this would be a real DB (Postgres, SQLite, etc.)

export type AppointmentStatus = "pending" | "confirmed" | "cancelled";

export interface Physician {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  avatar: string; // initials
  availableDays: number[]; // 0=Sun,1=Mon,...
}

export interface TimeSlot {
  id: string;
  physicianId: string;
  date: string; // ISO date string YYYY-MM-DD
  time: string; // "09:00"
  booked: boolean;
}

export interface Appointment {
  id: string;
  slotId: string;
  physicianId: string;
  physicianName: string;
  date: string;
  time: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  reasonForVisit: string;
  status: AppointmentStatus;
  createdAt: string;
}

// ── Seed data ──────────────────────────────────────────────────────────────

export const physicians: Physician[] = [
  {
    id: "dr-1",
    name: "Dr. Sarah Chen",
    specialty: "Internal Medicine",
    bio: "Board-certified internist with 12 years of experience in preventive care and chronic disease management.",
    avatar: "SC",
    availableDays: [1, 2, 3, 4, 5],
  },
  {
    id: "dr-2",
    name: "Dr. Marcus Webb",
    specialty: "Family Medicine",
    bio: "Family physician focused on whole-person care for patients of all ages. Fluent in English and Spanish.",
    avatar: "MW",
    availableDays: [1, 3, 5],
  },
  {
    id: "dr-3",
    name: "Dr. Priya Nair",
    specialty: "Cardiology",
    bio: "Interventional cardiologist specializing in heart disease prevention and advanced cardiac imaging.",
    avatar: "PN",
    availableDays: [2, 4],
  },
  {
    id: "dr-4",
    name: "Dr. James Okafor",
    specialty: "Dermatology",
    bio: "Dermatologist with expertise in medical, surgical, and cosmetic dermatology. Sees patients of all skin types.",
    avatar: "JO",
    availableDays: [1, 2, 4, 5],
  },
];

// Generate slots for the next 14 days
function generateSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const times = ["09:00", "09:30", "10:00", "10:30", "11:00", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  physicians.forEach((doc) => {
    for (let d = 1; d <= 14; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() + d);
      const dayOfWeek = date.getDay();

      if (!doc.availableDays.includes(dayOfWeek)) continue;

      const dateStr = date.toISOString().split("T")[0];

      times.forEach((time, i) => {
        slots.push({
          id: `${doc.id}-${dateStr}-${i}`,
          physicianId: doc.id,
          date: dateStr,
          time,
          booked: false,
        });
      });
    }
  });

  return slots;
}

// Global mutable store (survives hot reload in dev via globalThis)
declare global {
  // eslint-disable-next-line no-var
  var __store: {
    slots: TimeSlot[];
    appointments: Appointment[];
  } | undefined;
}

if (!global.__store) {
  global.__store = {
    slots: generateSlots(),
    appointments: [],
  };
}

export const store = global.__store;

// ── Helpers ────────────────────────────────────────────────────────────────

export function getPhysician(id: string) {
  return physicians.find((p) => p.id === id);
}

export function getSlotsForPhysician(physicianId: string) {
  return store.slots.filter((s) => s.physicianId === physicianId && !s.booked);
}

export function getSlot(slotId: string) {
  return store.slots.find((s) => s.id === slotId);
}

export function bookSlot(slotId: string, appointmentData: Omit<Appointment, "id" | "createdAt">) {
  const slot = getSlot(slotId);
  if (!slot || slot.booked) return null;

  slot.booked = true;

  const appointment: Appointment = {
    ...appointmentData,
    id: `apt-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  store.appointments.push(appointment);
  return appointment;
}

export function updateAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
  const apt = store.appointments.find((a) => a.id === appointmentId);
  if (!apt) return null;

  if (status === "cancelled") {
    // Free the slot back up
    const slot = getSlot(apt.slotId);
    if (slot) slot.booked = false;
  }

  apt.status = status;
  return apt;
}
