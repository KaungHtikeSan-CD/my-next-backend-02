import { verifyJWT } from "@/lib/auth";
import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { errorResponse } from "@/lib/utils";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

const COLLECTION_NAME = "item";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function PUT(request, { params }) {
  if (!verifyJWT(request)) return errorResponse("Unauthorized Request", 401);

  try {
    const id = await getObjectId(params);
    if (!id) return errorResponse("Invalid item id", 400);

    const input = await request.json();
    const validationError = validateItem(input);
    if (validationError) return errorResponse(validationError, 400);

    const collection = await getItemCollection();
    const result = await collection.findOneAndUpdate(
      { _id: id, status: { $ne: "DELETED" } },
      {
        $set: {
          name: input.name.trim(),
          description: input.description?.trim() || "",
          quantity: Number(input.quantity ?? 0),
          price: Number(input.price ?? 0),
          status: "ACTIVE",
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

    if (!result) return errorResponse("Item not found", 404);

    return NextResponse.json(
      { message: "Item updated", item: serializeItem(result) },
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("Update item error:", error);
    return errorResponse("Unable to update item", 500);
  }
}

export async function DELETE(request, { params }) {
  const user = verifyJWT(request);
  if (!user) return errorResponse("Unauthorized Request", 401);

  try {
    const id = await getObjectId(params);
    if (!id) return errorResponse("Invalid item id", 400);

    const collection = await getItemCollection();
    const result = await collection.findOneAndUpdate(
      { _id: id, status: { $ne: "DELETED" } },
      {
        $set: {
          status: "DELETED",
          deletedAt: new Date(),
          deletedBy: user.id,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

    if (!result) return errorResponse("Item not found", 404);

    return NextResponse.json(
      { message: "Item soft-deleted", item: serializeItem(result) },
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("Delete item error:", error);
    return errorResponse("Unable to delete item", 500);
  }
}

async function getObjectId(params) {
  const { id } = await params;
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
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
