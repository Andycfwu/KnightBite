# Livingston station illustration

`livingston-station-map.png` is AI-generated concept artwork, created September 8, 2026 for KnightBite. It is not a surveyed floor plan or evidence of today's food inventory.

Reference: Rutgers' numbered Livingston interior photograph and station descriptions at https://food.rutgers.edu/places-eat/dining-hall-tour (image: https://food.rutgers.edu/sites/default/files/inline-images/ds_ldcartboard-1.png). The photo shows a central salad/deli island and surrounding counters. Illustrated positions are approximate and require on-site confirmation before any wayfinding claim. The source photo is not bundled or displayed by the app.

The seven regions correspond to pizza/pasta, specialty cook-to-order, Mongolian grill, salad/deli, rotisserie, breakfast/dessert, and roasted vegetables. Hotspot coordinates and exact name aliases live in `lib/livingston-stations.ts`. The aliases were cross-checked with the September 8, 2026 Livingston Nutrislice lunch response. No upstream identifier-stability guarantee is assumed. Ambiguous categories such as PUB, CTO MASTER, ENTREES and ASIAN INSPIRED CUISINE remain under More stations. Missing mapped items do not establish that a counter is closed.

The illustration is a static PNG, rendered through Next Image; all labels and interactions are HTML, not baked into the artwork. It has no dependency on WebGL or an external image service at runtime. Search and the list view preserve access to every returned station.
