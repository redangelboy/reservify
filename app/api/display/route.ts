import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: "postgresql://reservify_user:reservify123@localhost:5432/reservify"
});
const prisma = new PrismaClient({ adapter });

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

    const business = await prisma.business.findUnique({
      where: { slug },
      include: { staff: { where: { active: true } } }
    });

    if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        businessId: business.id,
        date: { gte: startOfDay, lte: endOfDay },
        status: { not: "cancelled" }
      },
      include: { service: true, staff: true },
      orderBy: { date: "asc" }
    });

    return NextResponse.json({ business, appointments });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
