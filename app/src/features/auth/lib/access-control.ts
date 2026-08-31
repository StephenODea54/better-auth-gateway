import { createAccessControl } from "better-auth/plugins/access";

export const ac = createAccessControl({
  ac: ["create", "delete", "read", "update"],
  invitation: ["cancel", "create"],
  member: ["create", "delete", "update"],
  organization: ["delete", "update"],
} as const);

export const roles = {
  admin: ac.newRole({
    ac: ["create", "delete", "read", "update"],
    invitation: ["cancel", "create"],
    member: ["create", "delete", "update"],
    organization: ["update"],
  }),
  member: ac.newRole({
    ac: ["read"],
  }),
  owner: ac.newRole({
    ac: ["create", "delete", "read", "update"],
    invitation: ["cancel", "create"],
    member: ["create", "delete", "update"],
    organization: ["delete", "update"],
  }),
};
