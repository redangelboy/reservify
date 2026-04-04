import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { getMainBusinessIdForOwner } from "@/lib/main-business";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // 1. Intentar como Owner primero
    const owner = await prisma.owner.findUnique({ where: { email } });

    if (owner) {
      const valid = await bcrypt.compare(password, owner.password);
      if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

      const mainId = await getMainBusinessIdForOwner(prisma, owner.id);
      if (!mainId) return NextResponse.json({ error: "No business found" }, { status: 400 });

      const business = await prisma.business.findUnique({ where: { id: mainId } });
      if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

      const response = NextResponse.json({
        success: true,
        owner: { id: owner.id, name: owner.name, email: owner.email },
        business: { id: business.id, name: business.name, slug: business.slug },
      });

      response.cookies.set("session", JSON.stringify({
        ownerId: owner.id,
        businessId: business.id,
        businessName: business.name,
        slug: business.slug,
      }), { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: "/" });

      return response;
    }

    // 2. Intentar como StaffUser
    const staffUser = await prisma.staffUser.findUnique({
      where: { email },
      include: { business: true },
    });

    if (staffUser) {
      if (!staffUser.active) return NextResponse.json({ error: "Account disabled" }, { status: 401 });

      const valid = await bcrypt.compare(password, staffUser.password);
      if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

      const response = NextResponse.json({
        success: true,
        user: { id: staffUser.id, name: staffUser.name, role: staffUser.role },
        business: { id: staffUser.business.id, name: staffUser.business.name },
      });

      response.cookies.set("session", JSON.stringify({
        staffUserId: staffUser.id,
        businessId: staffUser.businessId,
        businessName: staffUser.business.name,
        slug: staffUser.business.slug,
        role: staffUser.role,
        staffId: staffUser.staffId,
        userType: "staff",
      }), { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: "/" });

      return response;
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
