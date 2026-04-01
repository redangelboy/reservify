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
      include: {
        staff: { where: { active: true } },
        services: { where: { active: true } },
      }
    });

    if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(business);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { slug, staffId, serviceId, date, time, clientName, clientPhone, clientEmail } = await req.json();

    if (!slug || !staffId || !serviceId || !date || !time || !clientName || !clientPhone) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { slug } });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const appointmentDate = new Date(`${date}T${time}:00`);

    const appointment = await prisma.appointment.create({
      data: {
        businessId: business.id,
        staffId,
        serviceId,
        clientName,
        clientPhone,
        clientEmail: clientEmail || null,
        date: appointmentDate,
        status: "confirmed",
        source: "web",
      }
    });

    // Notificar pantalla en tiempo real
    if ((global as any).io) {
      (global as any).io.to(`display-${slug}`).emit("new-appointment", appointment);
    }

    return NextResponse.json({ success: true, appointmentId: appointment.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
