// Explicit provider labels only. No ingredient scanning or free-from inference.
const DIETARY: Record<string,string> = {
  vegan:'vegan', vegetarian:'vegetarian', halal:'halal', kosher:'kosher',
  'gluten free':'gluten-free', 'milk free':'milk-free', 'dairy free':'dairy-free',
  'nut free':'nut-free', 'peanut free':'peanut-free', 'tree nut free':'tree-nut-free',
  'no gluten':'gluten-free', 'no milk':'milk-free', 'no nuts':'nut-free'
};
const ALLERGENS = new Set(['milk','dairy','egg','eggs','soy','wheat','gluten','peanut','peanuts','tree nut','tree nuts','nuts','sesame','shellfish','fish']);
const CONFLICTS: Record<string,string[]> = {
  'gluten-free':['gluten','wheat'], 'milk-free':['milk','dairy'], 'dairy-free':['milk','dairy'],
  'nut-free':['nuts','peanut','peanuts','tree nut','tree nuts'], 'peanut-free':['peanut','peanuts'], 'tree-nut-free':['tree nut','tree nuts']
};
export function classifyDietaryLabels(labels: string[]) {
  const tags = new Set<string>(), allergens = new Set<string>(), sourceLabels = new Set<string>();
  const present = new Set<string>();
  for(const raw of labels) {
    const label=raw.trim().toLowerCase().replace(/[-_]+/g,' ').replace(/\s+/g,' ');
    if(DIETARY[label]) { tags.add(DIETARY[label]); continue; }
    const substance=label.replace(/^(?:contains?|may contain)\s*:?\s*/, '');
    if(ALLERGENS.has(substance)) { allergens.add(label); present.add(substance); }
    else if(raw.trim()) sourceLabels.add(raw.trim());
  }
  for(const [tag,conflicts] of Object.entries(CONFLICTS)) if(tags.has(tag) && conflicts.some(value=>present.has(value))) {
    tags.delete(tag); sourceLabels.add(`${tag} (conflicts with another Rutgers label)`);
  }
  return { tags:tags.size ? [...tags] : undefined, allergens:allergens.size ? [...allergens] : undefined, sourceLabels:sourceLabels.size ? [...sourceLabels] : undefined };
}
