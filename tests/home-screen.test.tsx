import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeScreen } from "@/components/home/HomeScreen";
import { PlateProvider } from "@/hooks/usePlate";
import { diningHalls } from "@/lib/dining-halls";
import { HALL_GUIDES, matchesHallSearch } from "@/lib/hall-guides";

const hall = (id: string) => diningHalls.find((entry) => entry.id === id)!;

test("home search uses the hall's actual stations and campus, including aliases", () => {
  assert.equal(matchesHallSearch(hall("atrium"), "king's hawaiian"), true);
  assert.equal(matchesHallSearch(hall("busch"), "king's hawaiian"), false);
  assert.equal(matchesHallSearch(hall("neilson"), "cook douglass"), true);
  assert.equal(matchesHallSearch(hall("livingston"), "  LIVINGSTON   mongolian "), true);
  assert.equal(matchesHallSearch(hall("busch"), "CTO MASTER"), false);
  assert.equal(matchesHallSearch(hall("busch"), "salad dressing"), true);
});

test("blank home search retains all halls and unrelated searches return none", () => {
  assert.equal(diningHalls.filter((entry) => matchesHallSearch(entry, "   ")).length, 4);
  assert.equal(diningHalls.filter((entry) => matchesHallSearch(entry, "unlisted campus")).length, 0);
});

test("home previews use the existing map artwork, station counts, and working hall links", () => {
  const html = renderToStaticMarkup(<PlateProvider><HomeScreen date="2026-09-10" statusByHall={{}} /></PlateProvider>);
  for (const entry of diningHalls) {
    const map = HALL_GUIDES[entry.id];
    const card = html.match(new RegExp(`<article[^>]*aria-labelledby="home-${entry.id}-title"[\\s\\S]*?</article>`))?.[0];
    assert.ok(card, `${entry.name} has a card`);
    assert.ok(card.includes(encodeURIComponent(map.image.src)), `${entry.name} uses its current map`);
    assert.ok(card.includes(`${map.zones.length} mapped stations`));
    assert.ok(card.includes(`href="/hall/${entry.id}"`));
  }
  assert.match(html, /href="\/plate"/);
  assert.match(html, /href="\/profile"/);
  assert.doesNotMatch(html, /\d+ Active Stations|swipes remaining|allergen-audited|certified|shortest line|occupancy/i);
});
