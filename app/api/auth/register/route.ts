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
    const { businessName, email, password, ownerName, phone } = await req.json();

    // Validaciones básicas
    if (!businessName || !email || !password || !ownerName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const existing = await prisma.owner.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Crear slug único para la barbería
    const slug = businessName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    // Verificar slug único
    const existingSlug = await prisma.business.findUnique({ where: { slug } });
    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

    // Hash del password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear negocio y owner en una transacción
    const result = await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: businessName,
          slug: finalSlug,
          phone: phone || null,
          plan: "starter",
          active: true,
        },
      });

      const owner = await tx.owner.create({
        data: {
          businessId: business.id,
          email,
          password: hashedPassword,
          name: ownerName,
        },
      });

      return { business, owner };
    });

    return NextResponse.json({
      success: true,
      businessId: result.business.id,
      slug: result.business.slug,
    });

  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}