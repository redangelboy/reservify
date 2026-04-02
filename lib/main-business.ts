import { PrismaClient } from "@prisma/client";

/**
 * Canonical catalog business for an owner: primary row (empty locationSlug), else oldest active business.
 */
export async function getMainBusinessIdForOwner(prisma: PrismaClient, ownerId: string) {
  const primary = await prisma.business.findFirst({
    where: { ownerId, active: true, locationSlug: "" },
    orderBy: { createdAt: "asc" },
  });
  if (primary) return primary.id;

  const fallback = await prisma.business.findFirst({
    where: { ownerId, active: true },
    orderBy: { createdAt: "asc" },
  });
  return fallback?.id ?? null;
}

export function isMainBusiness(b: { locationSlug: string | null | undefined }) {
  return (b.locationSlug ?? "") === "";
}

/** Session targets the owner's catalog business row (same id as getMainBusinessIdForOwner), not empty-slug-only. */
export function isOwnerMainBusinessSession(sessionBusinessId: string, mainBusinessId: string) {
  return sessionBusinessId === mainBusinessId;
}

/**
 * Client-side: prefer `isMainBusiness` from GET /api/business (canonical main row, including when locationSlug is "main").
 * Fallback for legacy payloads: empty / null locationSlug only.
 */
export function isMainBusinessFromPayload(biz: any): boolean {
  if (!biz) return false;
  if (typeof biz.isMainBusiness === "boolean") return biz.isMainBusiness;
  const ls = biz.locationSlug;
  return ls == null || ls === "" || String(ls).trim() === "";
}
