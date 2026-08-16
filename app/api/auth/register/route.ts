import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();
    const name = String(body?.name || "").trim();
    const password = String(body?.password || "");

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "invalidEmail" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "weakPassword" }, { status: 400 });
    }
    if (!name || name.length > 60) {
      return NextResponse.json({ error: "nameRequired" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "emailTaken" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: { email, name, passwordHash: await hashPassword(password) },
    });

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    setSessionCookie(token);

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch {
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
