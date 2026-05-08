import { NextResponse } from "next/server";
import { loadSheetPlotsData } from "@/lib/loadSheetPlots";

export async function GET() {
  const result = await loadSheetPlotsData();
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, rows: result.rows, caps: result.caps },
      { status: 500 }
    );
  }
  return NextResponse.json({ rows: result.rows, caps: result.caps });
}
