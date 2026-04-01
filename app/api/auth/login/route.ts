import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ 
    connectionString: "postgresql://reservify_user:reservify123@localhost:5432/reservify" 
  });
  const prisma = new PrismaClient({ adapter });

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Buscar owner por email
    const owner = await prisma.owner.findUnique({
      where: { email },
      include: { business: true },
    });

    if (!owner) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verificar password
    const validPassword = await bcrypt.compare(password, owner.password);
    if (!validPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Por ahorita guardamos sesión simple en cookie
    const response = NextResponse.json({
      success: true,
      owner: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        businessId: owner.businessId,
        businessName: owner.business.name,
        slug: owner.business.slug,
      },
    });

    // Cookie de sesión simple
    response.cookies.set("session", JSON.stringify({
      ownerId: owner.id,
      businessId: owner.businessId,
      businessName: owner.business.name,
    }), {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}