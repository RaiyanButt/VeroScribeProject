import { NextResponse } from "next/server";
import { getSlotsForPhysician } from "@/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const slots = getSlotsForPhysician(params.id);

  // Group by date for easy consumption
  const grouped: Record<string, typeof slots> = {};
  for (const slot of slots) {
    if (!grouped[slot.date]) grouped[slot.date] = [];
    grouped[slot.date].push(slot);
  }

  return NextResponse.json(grouped);
}
