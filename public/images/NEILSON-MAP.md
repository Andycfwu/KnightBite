# Neilson station map

`neilson-station-map.png` (1086 × 1448) was generated with the built-in image-generation tool on September 9, 2026. It uses the user's one-page `Untitled_Artwork.pdf` as a layout reference and the existing Busch artwork as a style reference. The source PDF is preserved unchanged outside the repository.

## Orientation and illustration limits

The requested transformation is a **90-degree clockwise rotation**, not a mirror. The original right-hand V-shaped entrance is at the bottom. Entrees sit at the lower left; cook-to-order, Asian-inspired cuisine, chicken and the vegan/cantina area progress up the left side. Deli is at the top, pizza/pasta at the upper right, ice cream further down the right, and the dietary-support landmark at the lower right. The central curved salad island opens toward the upper left.

The illustration is approximate, not an exact tracing or measured floor plan. Generation connected some originally separated left-bank counters, rounded the lower-left entree footprint, and altered upper-bank shapes. Station sequence and entrance orientation are retained, but these counter contours and gaps should not be used as precise wayfinding. Food illustrations are decorative and do not establish daily inventory. Interactive coordinates are aligned to the resulting illustration.

## Label verification

Checked September 9, 2026:

- [Rutgers dining hall tour](https://food.rutgers.edu/places-eat/dining-hall-tour), Neilson section, supports the nine food areas: entrees/sides, cook-to-order, Asian-inspired cuisine, chicken, vegan/vegetarian and cantina, deli, pizza/pasta, ice cream, and salad.
- Rutgers' “Special Dietary Needs” entry describes dietary assistance rather than a food station. The user's drawn location is retained as a noninteractive **Dietary support** landmark with a staff-assistance note. It has no menu count and receives no guessed foods.
- The current [Neilson Nutrislice lunch response](https://rutgers.api.nutrislice.com/menu/api/weeks/school/65291/menu-type/33316/2026/09/09/) confirmed the section names used below. This is a dated vocabulary check, not a promise of continuing availability.

## Exact menu section mapping

| Map area | Source section aliases |
| --- | --- |
| Entrees & sides | ENTREES, SIDES |
| Cook to order | COOK TO ORDER BAR, OMELET BAR |
| Asian-inspired cuisine | ASIAN INSPIRED CUISINE |
| Chicken & rotisserie | ROTISSERIE, GRILLED CHICKEN |
| Vegan/vegetarian & cantina | PLANT-BASED EATS, CANTINA, CANTINA SIDES |
| Deli | CUSTOM DELI BAR (KIOSK), DELI BAR ENTREE |
| Pizza & pasta | PIZZA & PASTA, PASTA STATION |
| Ice cream | ICE CREAM, ICE CREAM BAR |
| Salad bar | SALAD BAR, SALAD DRESSING |

SIDES, OMELET BAR, GRILLED CHICKEN, PASTA STATION and ice cream aliases were not present in the inspected lunch response; they are literal station names accepted if supplied. Unknown sections—including SOUPS, PREPARED SALADS, CTO MASTER, YOGURT BAR, BREADS, FRESH FRUIT and THREE CHILIES—remain under More stations and accessible through global search and List view. Nothing is assigned using food names or dietary tags. No upstream station/item objects, IDs, nutrition or provider behavior are changed.

The portrait map shares the existing explorer and plate controls. Its canvas is 500–540px wide; smaller screens pan horizontally or use the station legend. Nine food pins are distinct from the dietary-support landmark. Missing data keeps the illustration and honest unavailable state; an empty mapped section does not imply closure.

## Generation prompt

The following exact prompt was used with the built-in tool, once. Input 1 was the rendered user PDF; input 2 was `busch-station-map-v2.png`.

Use case: sketch-to-render.
Asset type: ONE text-free architectural dining station map illustration for KnightBite.
Input 1 (/tmp/knightbite-neilson/drawing.png) is the authoritative floor-plan sketch: preserve every counter footprint, relative location, gap and aisle. Input 2 (busch-station-map-v2.png) is STYLE ONLY: match its warm tile floor, pale stone countertops, restrained dark wood bases, steel and glass food wells, delicate outlines, soft shadows, miniature architectural rendering. Do NOT copy its geometry or add its islands.
Transform the sketch into a polished miniature nearly top-down architectural illustration. CRITICAL: rotate the entire sketch 90 degrees CLOCKWISE, never mirror. The original right edge becomes the BOTTOM; its inward angled V entrance must be at bottom center, open for walking, with a clear passage, never a solid blocking wall. Portrait 1200x1600 (3:4) composition; entire footprint visible with modest white padding. Very shallow overhead perspective minimizes occlusion; overhead plan geometry stays legible.
ROTATED GEOMETRY:
LEFT bank, from BOTTOM to TOP: a separate entree/sides rectangular counter; a clear gap; then one contiguous bank in order cook-to-order at its lower end, Asian cuisine in middle, chicken at upper end; a clear gap; vegan/cantina counter sweeping around the UPPER LEFT corner into the deli stretch along the TOP. Keep the original smoothly curved inner face of the cook-to-order/Asian section.
RIGHT bank: the broad pizza/baked pasta/cook-to-order pasta counter is UPPER RIGHT with its curving inner end faithfully corresponding to sketch; gap; separate ice-cream rectangular block on middle/lower right; gap; dietary support rectangular counter at lower right with its angled corner adjoining entrance geometry. Do not join the separate stations or fill the gaps.
CENTER: exactly ONE large organic curved horseshoe SALAD island, preserving sketch's distinctive uneven rounded teardrop horseshoe shape. Rotate its original left/lower-left opening to UP/UPPER LEFT. Keep the opening clearly cut through into its hollow interior. Do not turn into a closed oval, circle, extra island or square U. Retain broad open circulation around it.
Warm square tan tiles and pale counters, subtle wood and steel, food wells appropriate to stations without new counter objects. White surrounding backdrop fading at floor edges matching style reference.
Absolutely NO TEXT, labels, letters, numbers, signs, UI, markers, arrows, legend or watermark anywhere. No coffee counter, no extra counters, no chairs, tables, seating, people, plants or decoration. Layout fidelity to rotated sketch is the overriding priority. Return only one finished image.
