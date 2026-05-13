import { NextResponse } from "next/server";
import { store, bookSlot, getPhysician, getSlot } from "@/lib/store";

export async function GET() {
  // Return appointments sorted newest first
  const sorted = [...store.appointments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return NextResponse.json(sorted);
}

export async function POST(req: Request) {
  const body = await req.json();

  const { slotId, patientName, patientEmail, patientPhone, reasonForVisit } = body;

  if (!slotId || !patientName || !patientEmail || !reasonForVisit) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const slot = getSlot(slotId);
  if (!slot) return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  if (slot.booked) return NextResponse.json({ error: "Slot already booked" }, { status: 409 });

  const physician = getPhysician(slot.physicianId);
  if (!physician) return NextResponse.json({ error: "Physician not found" }, { status: 404 });

  const appointment = bookSlot(slotId, {
    slotId,
    physicianId: slot.physicianId,
    physicianName: physician.name,
    date: slot.date,
    time: slot.time,
    patientName,
    patientEmail,
    patientPhone: patientPhone || "",
    reasonForVisit,
    status: "pending",
  });

  return NextResponse.json(appointment, { status: 201 });
}
