import { and, eq, inArray, or, sql } from "drizzle-orm";

import { db } from "@/db/clients/db-client.ts";
import { member, organization, user } from "@/db/schema/index.ts";

export const SUPER_ADMIN_ROLE = "admin";

export const SUPER_ADMIN_MEMBER_MARKER = "gateway-admin";

const DEFAULT_ROLE = "user";

const OWNER_ROLE = "owner";

const markedMemberships = sql`${SUPER_ADMIN_MEMBER_MARKER} = any(string_to_array(${member.role}, ','))`;

const superAdminAccounts = sql`${SUPER_ADMIN_ROLE} = any(string_to_array(coalesce(${user.role}, ''), ','))`;

export async function enrollSuperAdmins(organizationId: string) {
  await grant([organizationId], await listSuperAdminUserIds());
}

export function includesSuperAdminMarker(role: unknown) {
  const requested = Array.isArray(role) ? role : String(role ?? "").split(",");

  return requested.map(name => String(name).trim()).includes(SUPER_ADMIN_MEMBER_MARKER);
}

export async function isFirstUser() {
  const [existing] = await db.select({ id: user.id }).from(user).limit(1);

  return !existing;
}

export function isSuperAdmin(role: null | string | undefined) {
  return splitRoles(role).includes(SUPER_ADMIN_ROLE);
}

export async function isSuperAdminMembership(memberIdOrEmail: string) {
  const [row] = await db
    .select({ id: member.id })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(and(
      markedMemberships,
      or(eq(member.id, memberIdOrEmail), eq(user.email, memberIdOrEmail)),
    ))
    .limit(1);

  return Boolean(row);
}

export async function listSuperAdminAccounts() {
  return db
    .select({
      createdAt: user.createdAt,
      email: user.email,
      id: user.id,
      image: user.image,
      name: user.name,
    })
    .from(user)
    .where(superAdminAccounts);
}

export async function listSuperAdminMemberIds(organizationId: string) {
  const rows = await db
    .select({ userId: member.userId })
    .from(member)
    .where(and(eq(member.organizationId, organizationId), markedMemberships));

  return new Set(rows.map(row => row.userId));
}

export async function listSuperAdminUserIds() {
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(superAdminAccounts);

  return rows.map(row => row.id);
}

export function splitRoles(roles: null | string | undefined) {
  return (roles ?? "")
    .split(",")
    .map(role => role.trim())
    .filter(role => role.length > 0);
}

export async function syncSuperAdminMemberships(userId: string) {
  const [account] = await db
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!account) {
    return;
  }

  if (!isSuperAdmin(account.role)) {
    await revoke(userId);
    return;
  }

  const organizations = await db.select({ id: organization.id }).from(organization);

  await grant(organizations.map(row => row.id), [userId]);
}

export function withoutSuperAdminRole(role: null | string | undefined) {
  const remaining = splitRoles(role).filter(name => name !== SUPER_ADMIN_ROLE);

  return remaining.length > 0 ? remaining : [DEFAULT_ROLE];
}

export function withSuperAdminRole(role: null | string | undefined) {
  return [...new Set([...splitRoles(role), SUPER_ADMIN_ROLE])];
}

async function grant(organizationIds: string[], userIds: string[]) {
  if (organizationIds.length === 0 || userIds.length === 0) {
    return;
  }

  const existing = await db
    .select({
      id: member.id,
      organizationId: member.organizationId,
      role: member.role,
      userId: member.userId,
    })
    .from(member)
    .where(and(
      inArray(member.organizationId, organizationIds),
      inArray(member.userId, userIds),
    ));

  const held = new Map(existing.map(row => [`${row.organizationId}:${row.userId}`, row]));

  const inserts: typeof member.$inferInsert[] = [];
  const upgrades: { id: string; role: string }[] = [];

  for (const organizationId of organizationIds) {
    for (const userId of userIds) {
      const row = held.get(`${organizationId}:${userId}`);

      if (!row) {
        inserts.push({
          createdAt: new Date(),
          id: crypto.randomUUID(),
          organizationId,
          role: `${OWNER_ROLE},${SUPER_ADMIN_MEMBER_MARKER}`,
          userId,
        });
        continue;
      }

      const roles = splitRoles(row.role);

      if (roles.includes(OWNER_ROLE) || roles.includes(SUPER_ADMIN_MEMBER_MARKER)) {
        continue;
      }

      upgrades.push({ id: row.id, role: grantedRoles(row.role) });
    }
  }

  await Promise.all([
    inserts.length > 0 ? db.insert(member).values(inserts) : undefined,
    ...upgrades.map(row =>
      db.update(member).set({ role: row.role }).where(eq(member.id, row.id)),
    ),
  ]);
}

function grantedRoles(roles: string) {
  return [...splitRoles(roles), OWNER_ROLE, SUPER_ADMIN_MEMBER_MARKER].join(",");
}

async function revoke(userId: string) {
  const marked = await db
    .select({ id: member.id, role: member.role })
    .from(member)
    .where(and(eq(member.userId, userId), markedMemberships));

  const removals = marked.filter(row => revokedRoles(row.role).length === 0);
  const downgrades = marked.filter(row => revokedRoles(row.role).length > 0);

  await Promise.all([
    removals.length > 0
      ? db.delete(member).where(inArray(member.id, removals.map(row => row.id)))
      : undefined,
    ...downgrades.map(row =>
      db
        .update(member)
        .set({ role: revokedRoles(row.role).join(",") })
        .where(eq(member.id, row.id)),
    ),
  ]);
}

function revokedRoles(roles: string) {
  return splitRoles(roles).filter(role =>
    role !== OWNER_ROLE && role !== SUPER_ADMIN_MEMBER_MARKER,
  );
}
