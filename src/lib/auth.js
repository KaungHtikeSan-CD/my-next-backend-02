import jwt from "jsonwebtoken";

export function verifyJWT(request) {
  const token = request.cookies.get("token")?.value;
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) return null;

  try {
    const payload = jwt.verify(token, secret);
    return {
      id: payload.id,
      email: payload.email,
      username: payload.username,
    };
  } catch {
    return null;
  }
}
