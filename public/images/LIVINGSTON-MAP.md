# Livingston station map

The September 10, 2026 revision follows the user's hand drawing. It preserves the circular perimeter, left and bottom public entrances, upper horseshoe-shaped salad/deli/fruit island and separate lower breakfast/dessert island. The sketch sets the positions; the panorama checks materials and general station relationships. This is an approximate illustration, not a surveyed floor plan.

## Sources and label decisions

- [Rutgers 360 tour](https://food.rutgers.edu/node/110): the Livingston panorama was opened and rotated interactively through four directions on September 10. [Underlying panorama](https://i.imgur.com/vbkxOLb.jpeg). Visible evidence includes dark counters with warm ribbed fronts, pale flooring with dark borders, a central island containing salad/deli wells and fresh fruit, curved perimeter cooking counters and circulation gaps. Small signs and all station boundaries cannot be read reliably from this single viewpoint.
- [Rutgers station guide](https://food.rutgers.edu/places-eat/dining-hall-tour): confirms Pizza/Pasta, Specialty Item of the Day (omelets at breakfast and changing lunch specialties), Mongolian Cook to Order, Salad and Deli, Rotisserie, Breakfast/Dessert, and composed salads/roasted vegetables. Special Dietary Needs refers to dietitian support, not a guarantee of vegetarian food or an allergy-safe serving station.
- [September 10 Nutrislice lunch response](https://rutgers.api.nutrislice.com/menu/api/weeks/school/68757/menu-type/33316/2026/9/10/): inspected only the matching day's section headers; FRESH FRUIT is added to the existing central salad/deli menu group. No provider or nutrition rules changed.

The drawing's top “rotating food” becomes Daily specialty / Specialty cook to order. Its central “fruit” label becomes Salad, deli & fruit, reflecting the panorama and official guide. The left/bottom entrances follow the user's explicit correction. The user subsequently confirmed that the right-hand bay is only a wall and that vegetables belong on the lower-left arc formerly labelled Dietary needs. Section 7 now uses that lower-left counter; the Dietary needs overlay and provisional-position note are removed. No foods are assigned to dietary support based on ingredient or dietary tags.

Exact section aliases live in `lib/livingston-stations.ts`. Existing conservative mapping remains: PUB, PUB SIDES, CTO MASTER, ASIAN INSPIRED CUISINE, GRILL STATION, YOGURT BAR and other unmatched categories remain under More stations, search and List view. They are not placed from guessed dish names. All original food objects remain accessible exactly once. Empty regions do not establish that a counter is closed.

## Implementation and validation

All labels are HTML overlays on one generated PNG. The shared explorer supports multiple entrance markers while retaining other halls' existing single markers. Seven serving-area buttons retain the existing search, List view, keyboard/touch selection and plate controls. The minimum 680px canvas supports horizontal panning on small screens.

The production build passed in an isolated copy, the local Livingston page returned HTTP 200, and `git diff --check` passed. 157 automated tests passed, including fresh-fruit conservation, unknown/dietary section separation, two entrance markers, unavailable states and existing menu/plate rendering. Reference panorama inspection is not local-app browser interaction testing. No local-app screenshots or interaction tests were performed. No changes were pushed or deployed; work remains on `codex/dining-hall-overhaul`.

## Generated artwork

`livingston-station-map-v2.png` (1415 × 1111) was created using one built-in image-generation request. The original image remains as a historical asset. The drawing, Rutgers panorama and Atrium image supplied respectively geometry, materials and rendering-style reference. Both public entrance gaps and the two distinct central islands are preserved. Small deviations: the unnamed right-hand bay became a narrow appliance strip bordering an empty alcove, the upper-right service break is wider, and counter surfaces/food details are illustrative.

Exact prompt:

```text
Use case: sketch-to-render.
Asset type: text-free dining hall station map artwork.
Primary request: Transform Image 1's exact hand-drawn floorplan into a polished architectural miniature bird's-eye render. The sketch is the authoritative blueprint: trace its footprint, all arcs, openings, counter shapes, proportions, and relative positions. Preserve the drawing's exact orientation.
Input roles: IMAGE 1 is the ONLY source of layout/geometry. IMAGE 2 is ONLY a material reference: dark glossy counter tops, warm bronze-brown front panels, stainless food wells, glass guards, pale cream terrazzo flooring. IMAGE 3 is ONLY a reference for polished miniature rendering quality, view angle, clean white margins, lighting, and detail level. Never borrow Image 3's rectangular layout, extra islands, or wood floor.
Camera and composition: near-orthographic top-down bird's-eye camera with only shallow depth, so plan geometry stays clear and matches the sketch. Landscape canvas approximately 1400x1100, aspect about 1.35. Entire circular footprint centered and visible with modest pure white margin. Roof removed, walls and equipment low enough that every station surface remains visible.
Exact perimeter: a large almost-circular outer ring of curved serving counters. Two WIDE public entrance openings at LEFT / 9 o'clock between pizza and dietary support, and at BOTTOM / 6 o'clock between dietary support and rotisserie. Preserve the small back-of-house break at 1 o'clock in the sketch. Curved counter sectors in order: pizza/pasta upper-left at 10 o'clock; specialty/cook-to-order at top 12 o'clock; Mongolian grill upper-right 2 o'clock; narrow unnamed counter right-middle at 3 o'clock; rotisserie lower-right at 4–5 o'clock; dietary support counter lower-left at 7–8 o'clock. The wide public openings must interrupt counters and walls completely and remain open.
Exact interior: ONLY TWO freestanding counter islands. UPPER island is ONE elongated horizontal C/horseshoe, with a long elongated empty interior cavity, two rounded bulbous end lobes, and a narrow break on its UPPER-RIGHT side exactly like Image 1. The front/bottom long arc joins the two end lobes. The back/top arc curves left from the upper-right opening and joins the left lobe. It is a single connected island, distinctly much wider than tall, NOT a closed ring or circle and NOT split into two separate islands. Add salad/deli food wells following its counter contours and fruit baskets on its front side. LOWER island is separate and much SMALLER: mushroom/keyhole-shaped breakfast and dessert counter with a horizontal oval top and a short rounded stem pointing straight DOWN; preserve this exact silhouette. Keep large empty walking aisles around and between both islands.
Materials and finishing: glossy dark charcoal countertops, warm ribbed bronze-brown wood front panels, stainless serving wells, transparent glass sneeze guards. Pale cream terrazzo floor with subtle thin dark geometric border lines. Small recognizable food assortments and compact cooking appliances confined to existing counters. Soft neutral illumination, tasteful contact shadows, professional architectural visualization, crisp shapes.
Constraints: Footprint fidelity is more important than photorealistic detail. Do not rotate, mirror, rearrange, simplify the C island, close entrances, invent extra islands, add walls across entry gaps, or crop the plan. No ceiling or hood obscuring stations. Absolutely NO text, lettering, labels, numbers, logos, R marks, signage, watermark, people, seating, or tables. All handwritten text in the sketch must disappear from the render.

```

## Vegetables / wall correction

The current asset is `livingston-station-map-v3.png` (1415 × 1111), a single targeted built-in ImageGen edit of v2. The lower-left arc now depicts roasted vegetables; the 3-o’clock appliance strip is replaced by plain curved wall. Both entrance gaps and other station footprints remain. Section 7 moved in the HTML overlay, with unchanged exact source-section aliases.

Exact edit prompt:

```text
Use case: precise-object-edit.
Edit the supplied dining hall map image with ONLY these two localized changes:
1. LOWER-LEFT perimeter arc, between the wide left entrance and wide bottom entrance, is the vegetables station. Preserve its exact curved footprint and position. Make this one cohesive, visually continuous vegetable-serving counter with varied roasted vegetable trays (broccoli, carrots, squash, green beans, cauliflower and mixed roasted vegetables) along the curved serving line. Keep the glossy charcoal countertop, warm ribbed bronze-brown panels, stainless trays and transparent sneeze guard, matching the continuous treatment of the existing pizza and top daily-specialty arcs. No dietary signage.
2. MIDDLE-RIGHT perimeter at exactly 3 o'clock is JUST A WALL. Remove the thin strip of stainless appliances/counter equipment currently hugging the outermost perimeter between the upper-right grill and lower-right rotisserie. Replace ONLY that thin equipment strip with a simple plain curved wall connecting those perimeter sections. Leave pale cream open floor inside this wall. There is no food station here: no countertop, black slab, appliances, trays, food or serving fixtures at 3 o'clock.
Preserve EVERYTHING ELSE exactly: framing, landscape aspect ratio and approximate 1415x1111 size; same circular outline; every other station location and food; wide LEFT entrance and wide BOTTOM entrance both fully open; upper-right service break; upper elongated C/horseshoe island and its opening/end lobes; small lower mushroom/keyhole island; all aisles; floor pattern, lighting, camera and rendering style. Do not join counters or walls across entrances. Do not add any island or station. No labels, text, numbers, logos, signs, people or seating. This is a precise local correction, not a redesign.

```

## Flush connection — manually edited with user approval

The current asset is `livingston-station-map-v4.png` (1415 × 1111). After two ImageGen attempts failed to remove the recess, the user explicitly approved manual image editing. A localized Pillow composite on v3 fills the entire recessed bay between sections 3 and 5 with a dark curved cap and a ribbed warm front face. Its inner edge joins the neighboring serving fronts. No station pins, menu mappings, entrance openings or other image regions were redesigned. The unsuccessful generated edits are not installed.
