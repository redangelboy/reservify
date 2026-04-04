import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function getSession(req: NextRequest) {
  const cookie = req.cookies.get("session")?.value;
  return cookie ? JSON.parse(cookie) : null;
}

export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session?.ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Obtener todos los businessIds del owner
  const businesses = await prisma.business.findMany({
    where: { ownerId: session.ownerId, active: true },
    select: { id: true }
  });
  const businessIds = businesses.map((b: any) => b.id);

  const users = await prisma.staffUser.findMany({
    where: { businessId: { in: businessIds } },
    include: { staff: true, business: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session?.ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, password, role, businessId, staffId } = await req.json();

  if (!name || !email || !password || !businessId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const existing = await prisma.staffUser.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.staffUser.create({
    data: { name, email, password: hashed, role: role || "STAFF", businessId, staffId: staffId || null },
    include: { staff: true },
  });

  return NextResponse.json({ success: true, user });
}

export async function DELETE(req: NextRequest) {
  const session = getSession(req);
  if (!session?.ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.staffUser.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
