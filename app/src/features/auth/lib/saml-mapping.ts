export interface SamlAttributeNames {
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}

export function buildSamlMapping(attributes: SamlAttributeNames) {
  const email = attributes.email?.trim();
  const firstName = attributes.firstName?.trim();
  const lastName = attributes.lastName?.trim();
  const name = attributes.name?.trim();

  return {
    email: email || "email",
    name: name || "displayName",
    ...(firstName ? { firstName } : {}),
    ...(lastName ? { lastName } : {}),
  };
}
