import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { loadLocationCatalog } from "@/lib/location-catalog";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
});
const prisma = new PrismaClient({ adapter });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const toNumber = body?.call_inbound?.to_number;

    if (!toNumber) {
      return NextResponse.json({ error: "Missing to_number" }, { status: 400 });
    }

    // Buscar el negocio por número de Retell
    const business = await prisma.business.findFirst({
      where: { retellPhoneNumber: toNumber, active: true }
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found for this number" }, { status: 404 });
    }

    // Obtener nombre del negocio completo (main + sucursal)
    let businessDisplayName = business.name;
    if (business.parentSlug && business.locationSlug) {
      const mainBusiness = await prisma.business.findFirst({
        where: { slug: business.parentSlug }
      });
      if (mainBusiness && mainBusiness.name !== business.name) {
        businessDisplayName = `${mainBusiness.name} - ${business.name}`;
      }
    }

    // Cargar staff y servicios desde la BD
    const { staff, services } = await loadLocationCatalog(prisma, business.id);

    const staffNames = staff.map((s: any) => s.name).join(", ");
    const serviceList = services
      .map((s: any) => `${s.name} $${s.price} (${s.duration} min)`)
      .join(", ");

    // Responder a Retell con las dynamic variables
    return NextResponse.json({
      call_inbound: {
        dynamic_variables: {
          slug: business.slug,
          business_name: businessDisplayName,
          staff_names: staffNames || "staff available",
          service_list: serviceList || "services available",
          address: business.address || "",
          phone: business.phone || "",
        }
      }
    });

  } catch (error) {
    console.error("Retell inbound webhook error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
