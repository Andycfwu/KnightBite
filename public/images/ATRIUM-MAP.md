# Atrium station map

## Exit correction — built-in image edit

The user clarified that the exit below checkout must remain in addition to the entrance beneath soup/salad. The current v3 image restores that opening. Checkout and Snack display overlays were removed in code.

Exact prompt:

Edit the supplied Atrium overhead miniature map with ONE precise architectural change: restore an open exit doorway in the bottom horizontal perimeter wall directly below the middle of the three checkout counters, centered at x49% of image, around y88%. Make a clear approximately 11%-of-image-width gap in this wall with short matching jambs and wood floor threshold leading to the white exterior. Keep the existing lower-left glass entrance door under the round salad island completely unchanged. Keep the full lower-right walkway to Scarlet Ginger unchanged. Preserve canvas dimensions/aspect ratio, framing, all counters and food details, all other walls, materials, lighting and station positions exactly. No text, labels, signs, arrows, numbers or logos. Return one edited image.

## Walkway and entrance revision — built-in edit prompt

```text
Use case: precise-object-edit.
Edit target: supplied Atrium overhead miniature floor map.
Make only these targeted architectural corrections, preserving canvas framing, scale, exact positions of ALL food counters, two central fridge islands, snack display and three checkout counters, materials and lighting.
1. Extend the wood-plank floor at the BOTTOM RIGHT into the existing white notch beneath the lower-right Scarlet Ginger counter. This must be a continuous broad walkway from the checkout floor horizontally RIGHT all the way to the outer right edge/end of the Scarlet Ginger wall. Its bottom boundary aligns with the existing bottom floor boundary. Continue a low perimeter wall along its bottom and far right edges; leave the walkway fully open to the checkout floor and immediately below the Scarlet Ginger counter. No obstruction at the old notch edge.
2. Add a clearly open entrance doorway in the horizontal lower-left alcove wall DIRECTLY BENEATH the circular soup/salad island, centered at about x=17% of canvas and y=69%. Use two short door jambs and a visible open glass door leaf, with a gap in the wall so visitors enter from the white exterior below that circle. Do not move or change the circle. Close the old bottom-center doorway with matching continuous low perimeter wall and remove its projecting threshold. The main entrance is now the lower-left door under the circle.
3. The large dark rectangular feature-wall area between the upper-right and lower-right food bays should be a restrained light neutral architectural surface instead of a large black slab; keep the two food bays fixed.
No words, labels, numbers, logos, R lettering, UI pins, arrows, people or new counters. All station labels are separate HTML. Preserve all untouched geometry and keep image aspect ratio. Return one edited image.
```

## Original sources and implementation

`atrium-station-map-v3.png` is the current 1355 × 1161 map, edited with the built-in image tool from the original `atrium-station-map.png`.

The illustration uses the user's `Untitled_Artwork.JPG` as its footprint reference, without rotation or mirroring. The user’s subsequent correction places the entrance directly beneath the soup/salad circle at the lower left and extends the bottom walkway to the end of the Scarlet Ginger wall. The current revision implements that correction, retains the separate bottom-center exit below checkout, and replaces the dark feature panel with a neutral surface. Rutgers' panorama was explored interactively in multiple directions on September 9, 2026 to check the unlabeled parts. The map is an approximate illustration, not a measured floor plan or a claim about current inventory.

## References and observed labels

- [Rutgers dining hall tour](https://food.rutgers.edu/places-eat/dining-hall-tour), Atrium descriptions and embedded panorama.
- [Rutgers' Atrium panorama viewer](https://cdn.pannellum.org/2.5/pannellum.htm#panorama=https%3A//i.imgur.com/w2ByGQD.jpeg&title=The%20Atrium&author=Rutgers%20Dining%20Services&autoLoad=true), with [the underlying panorama](https://i.imgur.com/w2ByGQD.jpeg).
- [Rutgers soup and salad photograph](https://food.rutgers.edu/sites/default/files/inline-images/5h6a3864.JPG), which shows the salad counter near Pi Pizza. The user's circular symbol is treated as a schematic for that area; the photo's precise counter contour is not circular.
- [September 9 Atrium lunch menu](https://menuportal23.dining.rutgers.edu/FoodPronet/pickmenu.aspx?locationNum=13&dtdate=9%2F9%2F2026&activeMeal=Lunch&sName=) and the corresponding breakfast page, inspected for exact section names. The existing provider still validates requested meal/date/location before parsing menus.

The five perimeter brands agree with the sketch. The panorama identifies two central refrigerated displays with packaged foods and drinks, a small snack display above them, checkout counters near the entry, and a dark Rutgers R feature wall between Three Chilies and Scarlet Ginger. The feature wall is not a serving station. The user's three checkout footprints are retained as schematic positions, without implying three active tills. Original reference photos are not displayed or bundled in the application.

Seven food areas have eight clickable locations: Pi Pizza, Mezze, King's Hawaiian, Three Chilies, Scarlet Ginger, soup/salad, and the two grab-and-go displays. The two displays share one menu group and count; no food objects are duplicated. The snack display and checkout are shown in the artwork without text labels. The R wall label has been removed at the user’s request.

## Menu mapping

| Area | Exact source sections |
| --- | --- |
| Pi Pizza | PI PIZZA; PI PIZZA TOPPINGS |
| Mezze | MEZZE PROTEINS; MEZZE BASES; MEZZE TOPPINGS AND SIDES |
| King's Hawaiian | KINGS HAWAIIAN; KINGS HAWAIIAN SIDES; KINGS HAWAIIAN TOPPINGS |
| Three Chilies | THREE CHILIES; THREE CHILIES TOPPINGS |
| Scarlet Ginger | SCARLET GINGER; SCARLET GINGER NOODLE BOWL |
| Soup & salad | SALAD BAR; SOUPS; YOGURT BAR (breakfast) |
| Grab & go | GRAB AND GO |

Literal brand-name and punctuation variants are also accepted by `lib/atrium-stations.ts`. Matching is exact after whitespace and case normalization, never inferred from a food name, ingredient or dietary tag. Unknown source sections remain available under More stations, search and List view. The branded bowls' bases, toppings and sides remain the original source sections inside their brand's food panel.

The existing shared explorer supplies keyboard/touch selection, responsive map panning, global search, the full menu list and plate actions. Empty regions mean no items were listed, not that a station is closed. Missing data keeps the illustration with the existing honest unavailable message. No mock fallback, source changes, cache changes or nutrition changes were introduced.

## Validation

All 156 automated tests passed, as did the production build and whitespace checks. The local Atrium route returned HTTP 200. Its first load took about 146 seconds because most upstream nutrition-label requests timed out; the provider returned its existing partial real menu result. The map does not change those timeouts or fill missing nutrition.

The automated checks cover exact labels, preservation of source objects, unknown labels, breakfast versus lunch grouping, shared refrigerated-island menus, landmark separation, and real/unavailable/sample rendering. Panorama browsing is source verification; it is not interaction testing of the local app. Local app browser interaction tests were not performed for this revision.

## Image generation

The built-in image-generation tool was used. The first request was rejected before generation because a JPG reference contained unsupported MPO data; that reference was converted to a standard PNG and the same request was resubmitted. No design variants were requested.

The generated scene preserves the main footprint, bay order, two refrigerated islands, central display, three checkout counters and bottom entrance. Known illustration differences: right-side serving counters face downward instead of inward, the R feature wall appears as a broad flat dark zone, the snack display is slightly rectangular, and the original lower-right floor ended in a notch (corrected in the current revision). Counter directions, exact wall contours and dimensions remain approximate.

The exact prompt follows. The third reference was supplied as the format-corrected `salad-photo-standard.png` on the successful call; the descriptive role in the prompt is unchanged.

Use case: sketch-to-render
Asset type: one raster base image for KnightBite's Atrium dining station map, with all labels added separately in HTML.
Primary request: faithfully render the exact simple plan in reference image 1 as a polished near-direct bird's-eye architectural miniature cutaway. This is a geometry-preserving translation of the hand sketch. Do not redesign the plan.
Input images: Image 1 (Untitled_Artwork.JPG) is the authoritative floor footprint, positions, orientation, counts, and shapes. Image 2 (panorama.jpeg) is ONLY actual Atrium materials and object-type reference; its panoramic curvature must never change the geometry. Image 3 (salad-photo.jpg) is ONLY the soup/salad counter materials and central column reference. Image 4 (busch-station-map-v2.png) is ONLY the crisp overhead miniature rendering style; NEVER copy its layout, angular counters, or tan tile floor.
Orientation and framing: keep the hand sketch's entrance at BOTTOM. Do not rotate or mirror. Near-orthographic bird's-eye view with only very shallow visible object depth, no dramatic isometric angle. Landscape near-square approximately 1400 x 1200 or 4:3. Fit the whole footprint with a modest plain white margin. Straight plan edges remain horizontal/vertical.

GEOMETRY — the first reference is binding:
Preserve the stepped outside floor outline: a roughly square main floor, a left-side alcove/wing with a bottom-left inward notch, a raised top step occupied by two rear bays, and a centered bottom door opening.
Upper LEFT wing: ONE simple rectangular pizza counter bay. Pizza trays identify its use. Preserve its independent rectangular footprint.
Lower LEFT alcove: ONE circular/rounded ring-shaped soup/salad island surrounding ONE central structural pillar. Light countertop, glass sneeze guards, stainless food wells, vegetables and soup pots. Leave open floor around it. This is the ONLY rounded counter.
TOP rear step: exactly TWO adjacent rectangular food-service bays, Mezze on the LEFT and King's Hawaiian on the RIGHT, separated visibly at their shared boundary. Each has a straight counter facing down into the main walking area, shallow backwall, and appropriate generic food trays.
Upper RIGHT wing: ONE rectangular Three Chilies serving bay facing left into the main floor. Keep it a simple rectangle.
MIDDLE RIGHT: a plain dark Rutgers feature WALL panel facing the room. This zone contains NO food counter, trays, shelves, or extra station. Keep it clearly distinct between the upper and lower right bays.
Lower RIGHT wing: ONE rectangular Scarlet Ginger serving bay facing left into the main floor.
CENTER above the long islands: exactly ONE SMALL SQUARE snack display, by itself.
CENTER middle: exactly TWO long, narrow, straight RECTANGULAR refrigerated grab-and-go shelf cases, parallel with long axes running VERTICALLY from top to bottom. There is a clear straight walking aisle BETWEEN them and open floor on all sides. Dark refrigerated case bodies with stainless trim, low shelves/glass and rows of packaged sandwiches, drinks, yogurt and sealed fruit cups. These are packaged-food refrigeration cases, NOT open salad bars. Do not join them, curve them, add end caps that connect them, or make U shapes.
BOTTOM below these two islands and before the entrance: exactly THREE small, separate square checkout counters in one horizontal row, each with a tiny payment screen. Preserve gaps between all three.
All food-service bays remain separate rectangular blocks. Preserve open walking gaps, boundaries and notches. Never merge different stations into a continuous perimeter counter. No wraparound counter, semicircle, horseshoe, diagonal layout, or extra counter.

Appearance: refined, realistic architectural scale model, clean and legible, minimal shallow depth, soft neutral lighting, restrained shadows. Actual Atrium gray-brown wood PLANK flooring, light gray and white counters, brushed stainless steel, dark refrigerated cases, small understated red accents on station backwalls as seen in the panorama. Do not reproduce the Busch tan tile floor or its floor plan. Counters use appropriate generic food trays without brands or labels. Food is miniature detail, the plan is the main subject. Keep all the floor circulation readable.
Text: NONE. No readable words, letters, numbers, station labels, title, arrows, legends, UI, logos, R lettering, or watermarks. The dark feature wall must be plain dark with no writing.
Avoid: people, furniture, chairs, dining tables, coffee station, added plants, decorations, roof, ceilings, high walls obscuring floor, extra islands, extra checkout counters, merged counters, invented floor space. Return one image only.
