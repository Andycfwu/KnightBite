# FoodProNet response evidence

These are sanitized excerpts of public Rutgers FoodProNet responses inspected on September 8, 2026. They are regression fixtures, not current dining information. No live request is made by the tests.

## Observed menu responses

All five menu requests below returned HTTP 200. Counts refer to raw `<fieldset>` item rows before KnightBite normalization, not deduplicated items or food inventory.

| Fixture | Requested context | Observed context and outcome |
| --- | --- | --- |
| `observed-lunch.html` | Location 13, September 8, 2026, Lunch; empty `sName`, omitted `locationName` | Selected date September 8; active Lunch; blank location heading; Atrium footer; 341 rows. Validator accepts context. |
| `observed-dinner.html` | Location 13, September 9, 2026, Dinner; empty `sName`, omitted `locationName` | Selected date September 9; active Dinner; blank location heading; Atrium footer; 338 rows. Validator accepts context. |
| `observed-breakfast.html` | Location 13, September 8, 2026, Breakfast; `locationName=The Atrium`, `sName=Rutgers University Dining` | Selected date September 8; active Breakfast; named Atrium heading and footer. Validator accepts context. |
| `observed-unselected-date.html` | Location 13, September 7, 2026, Dinner; empty `sName`, omitted `locationName` | The date options cover September 8–14; none is selected. The form still contains September 7, Dinner is active, and 339 item rows are returned. Validator rejects the missing selected date. |
| `observed-echoed-location.html` | Location 13, September 8, 2026, Lunch; deliberately supplied `locationName=Inspection Sentinel` | Heading says `Menus - Inspection Sentinel`; the menu footer still identifies Atrium. This establishes that the heading can echo request input. Validator rejects the conflict. |

Source requests:

- [September 8 lunch](https://menuportal23.dining.rutgers.edu/FoodPronet/pickmenu.aspx?locationNum=13&dtdate=9%2F8%2F2026&activeMeal=Lunch&sName=)
- [September 9 dinner](https://menuportal23.dining.rutgers.edu/FoodPronet/pickmenu.aspx?locationNum=13&dtdate=9%2F9%2F2026&activeMeal=Dinner&sName=)
- [September 8 breakfast with location name](https://menuportal23.dining.rutgers.edu/FoodPronet/pickmenu.aspx?locationNum=13&locationName=The+Atrium&dtdate=9%2F8%2F2026&activeMeal=Breakfast&sName=Rutgers+University+Dining)
- [September 7 dinner outside the returned date options](https://menuportal23.dining.rutgers.edu/FoodPronet/pickmenu.aspx?locationNum=13&dtdate=9%2F7%2F2026&activeMeal=Dinner&sName=)
- [September 8 location-name echo probe](https://menuportal23.dining.rutgers.edu/FoodPronet/pickmenu.aspx?locationNum=13&locationName=Inspection+Sentinel&dtdate=9%2F8%2F2026&activeMeal=Lunch&sName=)

The directory URL `/FoodPronet/` returned HTTP 403. The existing page's Busch shortcut, `https://go.rutgers.edu/fpnetbusch`, redirected to Nutrislice, so it supplied no FoodProNet comparison evidence. Neither response is a validator fixture.

## What establishes the returned menu context

- **Date:** the single explicitly selected option's visible text inside `select[name="date"]`, for example `Tuesday, September 8, 2026`. An unselected option is only a navigation choice. Its selected option URL and the menu form's `dtdate` must agree with the displayed calendar date and request. The September 7 response demonstrates why the form date alone is insufficient.
- **Meal:** the single non-link `div.tab.active` immediately before the food-selection form. Its visible `Lunch` text and `aria-label="Lunch"` must agree with the form's `mealName`. Inactive tabs contain navigation links and supply no positive meal evidence.
- **Location:** the menu-associated `div.shortmenufooter` after the food-selection form begins with `"THE ATRIUM IS A TAKE- OUT ONLY OPERATION - `. That location-specific service note remains present when no location name is sent, and remains Atrium when a different name is sent. Require this note together with `locationNum=13` in the enclosing menu's nutrition-report form and selected date option. An arbitrary Atrium link, food name, or occurrence elsewhere in the document is insufficient.
- **Cross-check:** the `nutRpt.aspx` form encloses the displayed `menuBox` and submits the selected food items to the nutrition report. Its fields describe that selection, unlike an unrelated navigation URL. They are cross-checks, not independent proof of content accuracy. The inspected form has two `name` attributes (`recipe` and `menuForm`); validation does not depend on either name.
- **Heading/name limitations:** `Menus - The Atrium` is not sufficient positive location evidence because `locationName` is echoed. The observed blank `Menus -` heading is allowed only with the required footer and numeric location evidence. Nonempty conflicting headings or context location names reject the response.

The helper requires a single food-selection form and menu box, a date selector before the form, an active meal after the selector and before the form, and a single location footer after the form. It rejects missing, malformed, duplicated, or contradictory required evidence. Calendar validation uses numeric Gregorian arithmetic, with no server-local/UTC calendar conversion. Only observed full English date names, title-case meals, numeric slash-separated context dates, and whitespace differences are used; location names are not fuzzy matched.

Only the validated form is passed to the existing item parser. Comments and scripts cannot supply displayed context or additional accepted items. Rejections are logged as concise existing parser diagnostics before any nutrition-label fetch.

## Fixture construction and synthetic tests

The menu excerpts preserve the heading, complete date-option list, active/inactive tab markup, report-form attributes, menu box, first station heading, first two item labels/portions/nutrition links/icons, and location footer. Unrelated document layout, stylesheets, scripts, inputs, instructions, later items, and global navigation were removed; whitespace and the outer wrapper were shortened. Context values were not corrected or invented. The echo probe is an observed response to an intentionally altered request, not a hand-edited response.

`observed-dressing-label.html` and `observed-spinach-label.html` retain parser-relevant snippets from the first two September 8 lunch nutrition-label responses:

- [Dressing label, recipe 150157, portion 1](https://menuportal23.dining.rutgers.edu/FoodPronet/label.aspx?locationNum=13&locationName=&dtdate=9%2f8%2f2026&RecNumAndPort=150157*1)
- [Spinach label, recipe 130019, portion 4](https://menuportal23.dining.rutgers.edu/FoodPronet/label.aspx?locationNum=13&locationName=&dtdate=9%2f8%2f2026&RecNumAndPort=130019*4)

The September 10 remediation extracts the observed whitespace/bold variants for protein, sodium and sugars. Unavailable fields now remain null instead of becoming zero. These snippets have no independent recipe/name metadata; returned identity checks cover explicit context form fields when provided, with synthetic mismatch tests. A full sanitized label capture is still needed before adding other identity selectors.

All mutations in `atrium-menu-context.test.tsx` are **synthetic**: mismatches, omissions, duplicate/conflicting fields, invalid dates, comment/script-only context, empty/unusable menus, and lunch-item responses adapted to different meals. The observed breakfast/dinner excerpts are tested directly by the helper; synthetic meal variants support provider-integration tests with the two captured lunch labels. Fake-clock advances of 16 minutes expire all existing daily/page/label caches between tests; the production cache API and policies are unchanged.

## Limits and availability

This checks consistency of returned page metadata with the requested context. It does not establish real-time food inventory or guarantee that Rutgers' underlying menu content is accurate. The observation that the footer identifies the operation is based on these responses, not an upstream contract.

Changes to the selected controls, form, heading, or location-specific footer can cause rejection of otherwise useful Atrium pages until the source is reinspected. Rejected HTML retains the existing 15-minute page-cache lifetime; null daily menus retain the existing 2-minute lifetime. Validated meals still use the existing normalization and usability rules, and all-rejected/unusable days return `null` without mock fallback. No partial-menu UI, persistence, or stored-menu recovery was added.
