import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { errorResponse } from "@/lib/utils";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return errorResponse("Missing email or password", 400);
    }

    const user = checkAdmin(email, password) || (await checkUser(email, password));

    if (!user) {
      return errorResponse("Invalid email or password", 401);
    }

    const profile = toProfile(user);
    const token = createJwtToken(profile);
    const response = NextResponse.json(
      { message: "Login successful", user: profile },
      { status: 200, headers: corsHeaders },
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("Unable to log in", 500);
  }
}

function checkAdmin(email, password) {
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;

  if (!adminUser || !adminPass) return null;

  return adminUser === email && adminPass === password
    ? { _id: "-1", email, username: "admin" }
    : null;
}

async function checkUser(email, password) {
  const dbName = process.env.DB_NAME;
  if (!dbName) throw new Error("DB_NAME is not configured");

  const client = await getClientPromise();
  const db = client.db(dbName);
  const user = await db.collection("user").findOne({ email });

  if (!user || !user.password) return null;
  return (await bcrypt.compare(password, user.password)) ? user : null;
}

function toProfile(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    username: user.username,
  };
}

function createJwtToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");

  return jwt.sign(user, secret, { expiresIn: "7d" });
}
