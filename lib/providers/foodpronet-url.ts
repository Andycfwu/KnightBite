import { IngestionFailure } from "./menu-ingestion-log";

const BASE = "https://menuportal23.dining.rutgers.edu/FoodPronet/";
const PARAMETERS = new Set(["locationNum", "locationName", "dtdate", "RecNumAndPort"]);

/** Upstream HTML is untrusted. Validate before a cache lookup or any network call. */
export function foodProNetLabelUrl(href: string, requestedDate: string): string {
  const reject = () => { throw new IngestionFailure("destination_rejected"); };
  if (href.length > 2048 || /[\\\u0000-\u0020]/.test(href)) return reject();
  const path = href.split(/[?#]/, 1)[0];
  if (/%|(?:^|\/)\.{1,2}(?:\/|$)/i.test(path)) return reject();
  let url: URL;
  try { url = new URL(href, BASE); } catch { return reject(); }
  if (url.origin !== new URL(BASE).origin || url.pathname !== "/FoodPronet/label.aspx" ||
      url.username || url.password || url.port || url.hash) return reject();
  for (const name of url.searchParams.keys()) {
    if (!PARAMETERS.has(name) || url.searchParams.getAll(name).length !== 1) return reject();
  }
  const [year, month, day] = requestedDate.split("-");
  if (url.searchParams.get("locationNum") !== "13" ||
      url.searchParams.get("dtdate") !== `${Number(month)}/${Number(day)}/${year}` ||
      !/^\d{1,10}\*(?:\d{1,5}(?:\.\d{1,4})?)$/.test(url.searchParams.get("RecNumAndPort") ?? "") ||
      ![null, "", "The Atrium"].includes(url.searchParams.get("locationName"))) return reject();
  url.searchParams.sort();
  return url.href;
}
