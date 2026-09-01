import { and, eq, ne } from "drizzle-orm";

import type { db } from "@/db/clients/db-client.ts";

import { organizationRole } from "@/db/schema/index.ts";

import type { PermissionMap } from "./permissions.ts";

import { parsePermission } from "./permissions.ts";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function readCatalog(
  tx: Tx,
  organizationId: string,
  options?: { forUpdate?: boolean },
) {
  const query = tx
    .select({ id: organizationRole.id, permission: organizationRole.permission })
    .from(organizationRole)
    .where(and(
      eq(organizationRole.organizationId, organizationId),
      eq(organizationRole.role, "owner"),
    ))
    .limit(1);

  const [row] = options?.forUpdate ? await query.for("update") : await query;

  return {
    catalog: row ? parsePermission(row.permission) : {},
    row: row ? { id: row.id } : undefined,
  };
}

export async function sweepActions(
  tx: Tx,
  organizationId: string,
  key: string,
  revoked: string[],
) {
  if (revoked.length === 0) {
    return;
  }

  const grantedRoles = await tx
    .select()
    .from(organizationRole)
    .where(and(
      eq(organizationRole.organizationId, organizationId),
      ne(organizationRole.role, "owner"),
    ))
    .for("update");

  for (const grantedRole of grantedRoles) {
    const grants = parsePermission(grantedRole.permission);
    const granted = grants[key];

    if (!granted) {
      continue;
    }

    const remaining = granted.filter(action => !revoked.includes(action));

    if (remaining.length === granted.length) {
      continue;
    }

    if (remaining.length === 0) {
      delete grants[key];
    }
    else {
      grants[key] = remaining;
    }

    await tx
      .update(organizationRole)
      .set({ permission: JSON.stringify(grants) })
      .where(eq(organizationRole.id, grantedRole.id));
  }
}

export async function writeCatalog(
  tx: Tx,
  organizationId: string,
  row: { id: string } | undefined,
  catalog: PermissionMap,
) {
  if (row) {
    await tx
      .update(organizationRole)
      .set({ permission: JSON.stringify(catalog) })
      .where(eq(organizationRole.id, row.id));
    return;
  }

  await tx.insert(organizationRole).values({
    createdAt: new Date(),
    id: crypto.randomUUID(),
    organizationId,
    permission: JSON.stringify(catalog),
    role: "owner",
  });
}
