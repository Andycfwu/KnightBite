import { MealType } from "@/lib/types";

const FOODPRONET_BASE = "https://menuportal23.dining.rutgers.edu/FoodPronet/";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MEAL_LABELS = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };
const ATRIUM_FOOTER_PREFIX = '"THE ATRIUM IS A TAKE- OUT ONLY OPERATION - ';

// These selectors and the footer's role are documented in tests/fixtures/foodpronet/README.md.
// Read attributes as tokens so a value inside another quoted attribute cannot act as context.
function attribute(attributes: string, name: string): string | null {
  const tokens = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  const values: string[] = [];
  let end = 0;
  for (const match of attributes.matchAll(tokens)) {
    if (attributes.slice(end, match.index).trim()) return null;
    end = match.index! + match[0].length;
    if (match[1].toLowerCase() === name) values.push(match[2] ?? match[3] ?? match[4] ?? "");
  }
  return !attributes.slice(end).trim() && values.length === 1 ? values[0] : null;
}

function hasClass(attributes: string, name: string) {
  return attribute(attributes, "class")?.split(/\s+/).includes(name) === true;
}

function text(value: string) {
  // The observed context fields contain plain text, not nested markup or navigation links.
  return /[<>]/.test(value) ? null : value.replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function divsWithClass(html: string, name: string) {
  return Array.from(html.matchAll(/<div\b([^>]*)>/gi))
    .filter((match) => hasClass(match[1], name))
    .map((match) => {
      const rest = html.slice(match.index! + match[0].length);
      const close = rest.search(/<\/div\s*>/i);
      return { attributes: match[1], body: close < 0 ? "<unclosed>" : rest.slice(0, close), index: match.index! };
    });
}

function calendarDate(year: number, month: number, day: number) {
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > days[month - 1]) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function displayedDate(value: string | null) {
  const match = value?.match(/^(\w+), (\w+) (\d{1,2}), (\d{4})$/);
  if (!match) return null;
  const [, weekday, monthName, rawDay, rawYear] = match;
  const year = Number(rawYear), month = MONTHS.indexOf(monthName) + 1, day = Number(rawDay);
  const date = calendarDate(year, month, day);
  if (!date) return null;
  // Gregorian weekday check using calendar arithmetic, without local/UTC date conversion.
  const y = year - (month < 3 ? 1 : 0);
  const offset = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4][month - 1];
  const dayOfWeek = (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + offset + day) % 7;
  return WEEKDAYS[dayOfWeek] === weekday ? date : null;
}

function numericDate(value: string | null) {
  const match = value?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return match ? calendarDate(Number(match[3]), Number(match[1]), Number(match[2])) : null;
}

function pageParameters(value: string | null, page: string) {
  if (!value) return null;
  try {
    const url = new URL(value.replace(/&amp;/g, "&"), FOODPRONET_BASE);
    return url.origin === new URL(FOODPRONET_BASE).origin && url.pathname === `/FoodPronet/${page}`
      ? url.searchParams : null;
  } catch {
    return null;
  }
}

function singleParameter(params: URLSearchParams, name: string) {
  const values = params.getAll(name);
  return values.length === 1 ? values[0] : null;
}

export function validateAtriumMenuContext(
  html: string,
  requestedDate: string,
  mealType: MealType
): { menuHtml: string } | { reason: string } {
  // Comments/scripts cannot establish displayed context or supply accepted menu items.
  const page = html.replace(/<!--[\s\S]*?-->|<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  const forms = Array.from(page.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form\s*>/gi));
  const menuBoxes = divsWithClass(page, "menuBox");
  if (forms.length !== 1 || (page.match(/<form\b/gi)?.length ?? 0) !== 1 || menuBoxes.length !== 1 ||
      menuBoxes[0].index < forms[0].index! || menuBoxes[0].index >= forms[0].index! + forms[0][0].length) {
    return { reason: "missing or ambiguous menu form" };
  }
  const form = forms[0];
  const formEnd = form.index! + form[0].length;
  const params = pageParameters(attribute(form[1], "action"), "nutRpt.aspx");
  if (!params) return { reason: "missing or malformed menu form context" };

  const selectors = Array.from(page.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select\s*>/gi))
    .filter((match) => attribute(match[1], "name") === "date");
  if (selectors.length !== 1 || selectors[0].index! >= form.index!) return { reason: "missing or ambiguous date selector" };
  const options = Array.from(selectors[0][2].matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option\s*>/gi))
    .filter((match) => attribute(match[1], "selected") !== null);
  if (options.length !== 1) return { reason: "missing or ambiguous selected date" };
  const selectedDate = displayedDate(text(options[0][2]));
  const selectedParams = pageParameters(attribute(options[0][1], "value"), "pickmenu.aspx");
  if (!selectedDate || !selectedParams) return { reason: "malformed selected date" };
  if (selectedDate !== requestedDate || numericDate(singleParameter(params, "dtdate")) !== selectedDate ||
      numericDate(singleParameter(selectedParams, "dtdate")) !== selectedDate) {
    return { reason: "mismatched or conflicting menu date" };
  }

  const tabs = divsWithClass(page, "tab").filter((tab) => hasClass(tab.attributes, "active"));
  if (tabs.length !== 1 || tabs[0].index >= form.index! || tabs[0].index <= selectors[0].index!) {
    return { reason: "missing or ambiguous active meal" };
  }
  const meal = MEAL_LABELS[mealType];
  if (text(tabs[0].body) !== meal || attribute(tabs[0].attributes, "aria-label") !== meal ||
      singleParameter(params, "mealName") !== meal) {
    return { reason: "mismatched or conflicting menu meal" };
  }

  // The footer identifies the operation even when locationName (and thus the heading) is blank.
  // The enclosing food-selection form must also identify location 13. Navigation alone is insufficient.
  const footers = divsWithClass(page, "shortmenufooter");
  if (footers.length !== 1 || footers[0].index < formEnd || !text(footers[0].body)?.startsWith(ATRIUM_FOOTER_PREFIX)) {
    return { reason: "missing, ambiguous, or mismatched Atrium menu footer" };
  }
  if (singleParameter(params, "locationNum") !== "13" || singleParameter(selectedParams, "locationNum") !== "13") {
    return { reason: "missing or conflicting menu location" };
  }
  const headings = Array.from(page.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/gi))
    .map((match) => text(match[1])).filter((heading) => heading?.startsWith("Menus -"));
  if (headings.length !== 1 || !["Menus -", "Menus - The Atrium"].includes(headings[0]!)) {
    return { reason: "missing or conflicting menu location heading" };
  }
  for (const fields of [params, selectedParams]) {
    const names = fields.getAll("locationName");
    if (names.length > 1 || names.some((name) => name !== "" && name !== "The Atrium")) {
      return { reason: "conflicting menu location name" };
    }
  }
  const selectedMeals = selectedParams.getAll("mealName");
  if (selectedMeals.length > 1 || selectedMeals.some((name) => name !== "" && name !== meal)) {
    return { reason: "conflicting selected-date meal" };
  }

  return { menuHtml: form[0] };
}
