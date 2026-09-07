import { NextResponse } from "next/server";

export function notImplemented(resource: string) {
  return NextResponse.json({ error: `${resource} is scaffolded but not implemented.` }, { status: 501 });
}
