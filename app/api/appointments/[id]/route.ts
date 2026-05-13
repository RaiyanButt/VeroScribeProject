import { NextResponse } from "next/server";
import { updateAppointmentStatus, AppointmentStatus } from "@/lib/store";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { status } = body as { status: AppointmentStatus };

  if (!["pending", "confirmed", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = updateAppointmentStatus(params.id, status);
  if (!updated) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

  return NextResponse.json(updated);
}
