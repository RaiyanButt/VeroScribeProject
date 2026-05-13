import { NextResponse } from "next/server";
import { physicians } from "@/lib/store";

export async function GET() {
  return NextResponse.json(physicians);
}
