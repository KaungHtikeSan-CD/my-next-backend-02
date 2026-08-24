import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET() {
  try {
    const client = await getClientPromise();
    const db = client.db("sample_mflix");
    const result = await db
      .collection("comments")
      .find({})
      .skip(0)
      .limit(10)
      .toArray();

    return NextResponse.json(result, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("MongoDB test API error:", error);

    return NextResponse.json(
      { message: "Unable to connect to MongoDB" },
      {
        status: 500,
        headers: corsHeaders,
      },
    );
  }
}
