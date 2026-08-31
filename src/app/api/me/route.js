import { verifyJWT } from "@/lib/auth";
import corsHeaders from "@/lib/cors";
import { errorResponse } from "@/lib/utils";
import { NextResponse } from "next/server";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export function GET(request) {
  const user = verifyJWT(request);

  if (!user) {
    return errorResponse("Unauthorized Request", 401);
  }

  return NextResponse.json(
    { user },
    { status: 200, headers: corsHeaders },
  );
}
