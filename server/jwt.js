import * as jose from "jose";

function getSecret() {
  const raw = process.env.JWT_SECRET;
  if (!raw) {
    console.warn("JWT_SECRET não definido; a usar valor por defeito apenas para desenvolvimento.");
  }
  return new TextEncoder().encode(raw || "softstudy-dev-jwt-secret-change-in-production");
}

export async function signUserToken(userId) {
  return new jose.SignJWT({})
    .setSubject(userId)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifyUserToken(token) {
  const { payload } = await jose.jwtVerify(token, getSecret());
  return payload.sub;
}

export function authMiddleware() {
  return async (request, response, next) => {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      response.status(401).json({ ok: false, error: "Sem sessão." });
      return;
    }
    try {
      request.userId = await verifyUserToken(header.slice(7));
      next();
    } catch {
      response.status(401).json({ ok: false, error: "Sessão inválida." });
    }
  };
}
