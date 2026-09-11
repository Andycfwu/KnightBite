# Dependency and asset notice inventory

The September 10, 2026 lockfile inventory is recorded in [dependency inventory](audits/production-readiness-2026-09-10/remediation-evidence/dependencies.json). It records declared package licenses; this is an engineering inventory, not a legal clearance or complete redistribution notice bundle. Do not strip upstream LICENSE/NOTICE files from release artifacts.

Runtime packages Next.js, React/React DOM, clsx and Vercel Analytics declare MIT licenses. sharp declares Apache-2.0, and its platform libvips distribution includes LGPL-3.0-or-later and other native dependencies with their own terms. The installed `@img/sharp-libvips-*/README.md` lists native component licenses, and `versions.json` records the actual bundled versions. Recheck these on the deployment platform. Next also bundles components under `next/dist/compiled/**/LICENSE`; these are not fully described by the lockfile's top-level Next license. The selected ESLint, TypeScript and browser-test packages are development tools and retain their upstream licenses.

The application itself has no project-wide license grant recorded. A product/repository owner must decide distribution permissions and any additional third-party notice obligations before public distribution; this pass does not choose a license on their behalf.

Station-map artwork provenance and approximations remain documented in:

- [Livingston](../public/images/LIVINGSTON-MAP.md)
- [Busch](../public/images/BUSCH-MAP.md)
- [Neilson](../public/images/NEILSON-MAP.md)
- [Atrium](../public/images/ATRIUM-MAP.md)

These notes distinguish supplied sketches, generated illustrations and Rutgers reference material. Reference availability is not evidence of permission to redistribute Rutgers photography, marks or floor plans. No artwork changed in this remediation. Confirm asset and naming permissions with the owner; do not invent an endorsement, measured-map accuracy claim, or legal assurance.
