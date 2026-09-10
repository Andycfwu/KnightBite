import { createHash } from "node:crypto";
import type { MenuItem } from "./types";
import { NUTRIENTS } from "./nutrition";

export function itemVariantSignature(item: MenuItem): string {
  return JSON.stringify([item.name, item.servingSize ?? null, item.isCustom ?? false,
    ...NUTRIENTS.map((key) => item.nutrition[key] ?? null)]);
}

/** Keep noncolliding IDs; disambiguate every variant deterministically, never by source order. */
export function assignUniqueItemIds(items: MenuItem[]): void {
  const groups = new Map<string, MenuItem[]>();
  const reserved = new Set(items.map((item) => item.id));
  for (const item of items) groups.set(item.id, [...(groups.get(item.id) ?? []), item]);
  for (const [baseId, group] of groups) {
    if (group.length < 2) continue;
    for (const item of group) {
      const digest = createHash("sha256").update(itemVariantSignature(item)).digest("hex");
      let id = `${baseId}~${digest}`;
      while (reserved.has(id)) id += "~";
      reserved.add(id);
      item.id = id;
    }
  }
}
