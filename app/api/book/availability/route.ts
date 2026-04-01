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
    const staffId = searchParams.get("staffId");
    const serviceId = searchParams.get("serviceId");
    const date = searchParams.get("date");

    if (!slug || !staffId || !serviceId || !date) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({ where: { slug } });
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return NextResponse.json({ error: "Service not found" }, { status: 404 });

    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();

    // Buscar horario del barbero ese día
    const schedule = await prisma.schedule.findFirst({
      where: { businessId: business.id, staffId, dayOfWeek, active: true }
    });

    if (!schedule) return NextResponse.json({ slots: [] });

    // Citas existentes ese día
    const startOfDay = new Date(date + "T00:00:00");
    const endOfDay = new Date(date + "T23:59:59");
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        staffId,
        date: { gte: startOfDay, lte: endOfDay },
        status: { not: "cancelled" }
      }
    });

    // Generar slots disponibles
  const duration = service.duration;
    const slots: string[] = [];
    const [startH, startM] = schedule.startTime.split(":").map(Number);
    const [endH, endM] = schedule.endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const timeStr = `${h.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
      
      // Verificar si ese slot está ocupado
      const slotDate = new Date(`${date}T${timeStr}:00`);
      const isBooked = existingAppointments.some(apt => {
        const aptTime = new Date(apt.date);
        return aptTime.getTime() === slotDate.getTime();
      });

      if (!isBooked) slots.push(timeStr);
    }

    return NextResponse.json({ slots });
  } catch (error) {
    console.error(error);
    returnNextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
