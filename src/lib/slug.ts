export function sanitizeSubdomain(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 30);
}

export function isValidSubdomain(value: string) {
  return /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/.test(value);
}

export function toSlug(value: string) {
  const slug = sanitizeSubdomain(value.replace(/\s+/g, "-"));
  return slug.length >= 3 ? slug : `tenant-${Date.now().toString(36)}`;
}

export function randomSuffix() {
  return Math.random().toString(36).slice(2, 8);
}
