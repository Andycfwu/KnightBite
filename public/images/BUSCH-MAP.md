# Busch station illustration

`busch-station-map-v2.png` is a 1586 × 992 AI-generated illustration revised September 9, 2026 for KnightBite. The user supplied a hand-drawn plan, confirmed that visitors enter from the bottom, and identified the unlabeled counter between cook-to-order and pasta as the second entree section. This drawing supersedes the earlier panorama-derived geometry. Spacing and dimensions remain approximate; illustrated foods are decorative, not current inventory.

The approved draft was edited to remove the left coffee counter and the bread/toaster face of the left island. The taco face and lower vegetable counter remain. All baked-in words, numbers and arrows were removed so labels and the entrance marker are accessible HTML. The earlier square `busch-station-map.png` is retained as a historical asset and is no longer used by the app.

## References and limits

- User's Busch sketch, supplied September 9, 2026, and the two clarifications above establish the relative positions of the counters, central U-shaped island, dessert island, fruit stands and entrance.
- [Rutgers dining hall tour and numbered station descriptions](https://food.rutgers.edu/places-eat/dining-hall-tour), checked September 9. Rutgers describes the first of two entree lines as **typically Asian-inspired**. This supports the name “Entrees 1” with an explanatory note. It does not confirm a fixed cuisine, a rotation schedule, or which food is available in real time. Rutgers describes cook-to-order as omelettes at breakfast/brunch and specialty items at lunch/dinner.
- [Busch numbered interior photograph](https://food.rutgers.edu/sites/default/files/inline-images/ds_buschartboard-1.png) and [Rutgers Busch 360 tour](https://food.rutgers.edu/node/110) informed earlier materials and counter appearance. They are not the authority for this revision's floor layout. Original Rutgers photographs are not bundled or displayed in the app.
- The September 9 Busch Nutrislice lunch response was inspected to verify section vocabulary. Station-to-coordinate mapping remains a combination of user observations and exact menu labels, not an official coordinate feed.

## Menu mapping

`lib/busch-stations.ts` contains 16 numbered areas and 18 clickable locations. The central fruit area and both entry fruit stands select the same group; the food list and counts are not duplicated.

Observed exact names map as follows: ASIAN INSPIRED CUISINE to Entrees 1; ENTREES to the user-identified Entrees 2; COOK TO ORDER BAR to cook-to-order; PASTA STATION to pasta; PIZZA & PASTA to the pizza counter; CANTINA/CANTINA SIDES to taco; NOODLE BAR to noodle; SALAD BAR/SALAD DRESSING to salad; FRESH FRUIT to fruit; SUSHI/SUSHI SIDES to sushi. The mixed PIZZA & PASTA source remains intact under “Pizza & pasta”; individual foods are never assigned by guessing from their names. Literal ice cream, vegetables, sides, dessert, milk and juice aliases are supported if supplied but were not present in the inspected lunch response.

Unconfirmed locations such as ROTISSERIE, DELI BAR ENTREE, SOUPS, PREPARED SALADS, CTO MASTER, takeout and THREE CHILIES remain under **More stations**. The prior broad soup/salad and rotisserie/vegetable groupings were removed because this sketch does not establish those placements. Removing the coffee/toaster artwork does not delete any upstream foods: BREADS and other unplaced sections remain available through More stations, search and List view. No menu items, nutrition, ingestion or cache behavior were changed.

An empty mapped area says **No items listed here**, never that the station is closed. No fixtures or fabricated items fill gaps.

## Rendering and accessibility

The shared explorer uses the image's actual aspect ratio. The Busch canvas keeps a minimum width of 680px so all 18 buttons remain at least 44 × 44px without overlapping. Narrow screens scroll horizontally; the selected area is centered when selection changes. The legend gives access to every area without having to pan. Pins show names on hover, keyboard focus and selection, and selecting a station focuses its food panel. Livingston retains its square map and existing seven zones.

## Asset editing brief

Edit the approved Busch overhead illustration, preserving the existing counter geometry and warm stone, steel, wood and tile style. Remove the coffee area and bread/toaster counter face, retain the taco and vegetable serving faces, retain the back zigzag entree/omelette/pasta/pizza banks, right drinks and ice cream, separate dessert island, vertical central U-shaped noodle/salad/sides/fruit/sushi island and two entrance fruit stands. Remove all words, numbers, title and entrance arrow; leave clean surfaces for HTML labels. Do not relocate remaining stations, add a new floor plan or create a measured-plan claim.
