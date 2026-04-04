import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export async function GET(req: NextRequest) {
  try {
    const session = req.cookies.get("session")?.value;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { ownerId } = JSON.parse(session);
    if (!ownerId) return NextResponse.json({ appointments: [] });

    const businesses = await prisma.business.findMany({
      where: { ownerId, active: true },
      select: { id: true }
    });
    const businessIds = businesses.map((b: any) => b.id);

    const appointments = await prisma.appointment.findMany({
      where: { businessId: { in: businessIds }, status: "cancel_requested" },
      include: { staff: true, service: true },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ appointments });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
