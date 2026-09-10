# KnightBite

Mobile-first Next.js app for browsing Rutgers New Brunswick dining hall menus, building a virtual plate, and tracking live nutrition totals.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS

## Notes

- Mock dining hall and daily menu data live in `lib/mock-data.ts`.
- Shared types live in `lib/types.ts`.
- Nutrition math is isolated in `lib/nutrition.ts`.
- Future provider adapters live in `lib/providers/`.

## Preview QA Checklist

Use this checklist before sharing a preview link:

- Confirm `npm run build` passes.
- Open each hall and verify a usable menu loads.
- Verify Atrium renders live data when available and falls back cleanly when it does not.
- Confirm the hall status line matches the actual source state: `Live` or `Backup`.
- Add several items to the plate, adjust quantities, and confirm totals update correctly.
- Check the nutrition disclaimer appears only when items have missing or variable nutrition.
- Verify station jump pills scroll to the correct sections on long menus.
- Test the plate sheet open/close gestures on mobile and confirm the page behind it does not move.
