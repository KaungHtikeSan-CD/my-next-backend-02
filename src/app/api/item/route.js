import { verifyJWT } from "@/lib/auth";
import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { errorResponse } from "@/lib/utils";
import { NextResponse } from "next/server";

const COLLECTION_NAME = "item";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function GET(request) {
  if (!verifyJWT(request)) return errorResponse("Unauthorized Request", 401);

  try {
    const collection = await getItemCollection();
    const items = await collection
      .find({ status: { $ne: "DELETED" } })
      .sort({ createdAt: -1, _id: -1 })
      .toArray();

    return NextResponse.json(
      { items: items.map(serializeItem) },
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("List items error:", error);
    return errorResponse("Unable to load items", 500);
  }
}

export async function POST(request) {
  const user = verifyJWT(request);
  if (!user) return errorResponse("Unauthorized Request", 401);

  try {
    const input = await request.json();
    const validationError = validateItem(input);
    if (validationError) return errorResponse(validationError, 400);

    const now = new Date();
    const item = {
      name: input.name.trim(),
      description: input.description?.trim() || "",
      quantity: Number(input.quantity ?? 0),
      price: Number(input.price ?? 0),
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
      createdBy: user.id,
    };
    const collection = await getItemCollection();
    const result = await collection.insertOne(item);

    return NextResponse.json(
      { message: "Item created", item: serializeItem({ ...item, _id: result.insertedId }) },
      { status: 201, headers: corsHeaders },
    );
  } catch (error) {
    console.error("Create item error:", error);
    return errorResponse("Unable to create item", 500);
  }
}

async function getItemCollection() {
  const dbName = process.env.DB_NAME;
  if (!dbName) throw new Error("DB_NAME is not configured");

  const client = await getClientPromise();
  return client.db(dbName).collection(COLLECTION_NAME);
}

function validateItem(input) {
  if (!input.name?.trim()) return "Item name is required";
  if (!Number.isFinite(Number(input.quantity)) || Number(input.quantity) < 0) {
    return "Quantity must be a non-negative number";
  }
  if (!Number.isFinite(Number(input.price)) || Number(input.price) < 0) {
    return "Price must be a non-negative number";
  }
  return null;
}

function serializeItem(item) {
  return { ...item, _id: item._id.toString() };
}
