import assert from "node:assert/strict";
import { test } from "node:test";
import { foodProNetLabelUrl } from "@/lib/providers/foodpronet-url";

const query = "?locationNum=13&locationName=&dtdate=9%2f8%2f2026&RecNumAndPort=150157*1";
const origin = "https://menuportal23.dining.rutgers.edu";
for (const path of ["label.aspx", "/FoodPronet/label.aspx", `${origin}/FoodPronet/label.aspx`]) {
  test(`permits the intended FoodProNet label path: ${path}`, () => {
    const url = new URL(foodProNetLabelUrl(path + query, "2026-09-08"));
    assert.equal(url.origin, origin);
    assert.equal(url.pathname, "/FoodPronet/label.aspx");
  });
}
for (const href of [
  "http://127.0.0.1/label.aspx", "//evil.example/label.aspx", `${origin}.evil.example/label.aspx`,
  "http://menuportal23.dining.rutgers.edu/FoodPronet/label.aspx", `${origin}:444/FoodPronet/label.aspx`,
  "https://user:password@menuportal23.dining.rutgers.edu/FoodPronet/label.aspx",
  "../FoodPronet/label.aspx", "%2e%2e/FoodPronet/label.aspx", "/FoodPronet/x/../label.aspx",
  "/FoodPronet/label.aspx/../other", "/FoodPronet/%6cabel.aspx", "\\evil.example/label.aspx",
  "data:text/html,label.aspx", "/other/label.aspx", "label.aspx\n"
]) test(`rejects unintended label destination: ${href}`, () => {
  assert.throws(() => foodProNetLabelUrl(href + query, "2026-09-08"), /destination_rejected/);
});
for (const tail of ["&dtdate=9/8/2026", "&locationNum=12", "&redirect=https://evil.example", "#fragment"]) {
  test(`rejects ambiguous label context: ${tail}`, () => {
    assert.throws(() => foodProNetLabelUrl("label.aspx" + query + tail, "2026-09-08"), /destination_rejected/);
  });
}
test("rejects incorrect date and malformed recipe identity", () => {
  assert.throws(() => foodProNetLabelUrl("label.aspx" + query, "2026-09-09"), /destination_rejected/);
  assert.throws(() => foodProNetLabelUrl("label.aspx" + query.replace("150157*1", "garbage"), "2026-09-08"), /destination_rejected/);
});
