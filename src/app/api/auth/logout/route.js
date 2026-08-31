import corsHeaders from "@/lib/cors";
import { NextResponse } from "next/server";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export function GET() {
  const response = NextResponse.json(
    { message: "Logout successful" },
    { status: 200, headers: corsHeaders },
  );

  response.cookies.set("token", "", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
