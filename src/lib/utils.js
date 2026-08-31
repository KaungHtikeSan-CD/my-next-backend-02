import corsHeaders from "@/lib/cors";
import { NextResponse } from "next/server";

export function errorResponse(message, status = 500) {
  return NextResponse.json(
    { message },
    {
      status,
      headers: corsHeaders,
    },
  );
}
