import { SignJWT } from "jose";
import { auth } from "@/auth";

/** Mints a short-lived HS256 JWT asserting the signed-in user's Google
 * account id, for the browser to attach as `Authorization: Bearer` on
 * requests to the FastAPI backend. Signing has to happen server-side --
 * INTERNAL_AUTH_SECRET must never reach client JS, since anyone who read it
 * out of the bundle could mint a token for any account and both bypass and
 * grief the backend's rate limit. NextAuth's session cookie (httpOnly)
 * authenticates this same-origin request, so no extra credential is needed
 * from the caller. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(null, { status: 204 });
  }

  const secret = process.env.INTERNAL_AUTH_SECRET;
  if (!secret) {
    return new Response(null, { status: 204 });
  }

  const token = await new SignJWT({ sub: session.user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(secret));

  return Response.json({ token });
}
