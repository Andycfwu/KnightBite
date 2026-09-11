# Manual Safari and VoiceOver release procedure

Status: procedure prepared September 10, 2026; **not executed with VoiceOver**. Activation verification found macOS WebKit skipping the drawer’s buttons on Tab; the candidate now traverses all dialog controls explicitly. Chromium/WebKit automation verifies focus and DOM semantics, not spoken output, Safari's system integration or a full WCAG conformance assessment.

## Prepare safely

1. Record reviewer, date, macOS version, Safari version, build ID/source digest and keyboard/VoiceOver settings. Use the Node version in `.nvmrc` and a successful local `npm run build:isolated`, then `node scripts/synthetic-server.mjs`. Open `http://127.0.0.1:3217/profile` in actual Safari, in a fresh browser profile. Do not use production for synthetic tests.
2. The server harness supplies fixtures and blocks outbound provider traffic. In an ordinary Safari session the same-origin `/_vercel/insights/script.js` endpoint has no service handler, so the SDK logs a load failure and sends no analytics. Confirm this in Safari's Network inspector; do not add a live script, enable a proxy to Vercel, or open Rutgers/external account links. Analytics compatibility is a separate intercepted Playwright test, not this manual check.
3. Enable macOS **System Settings → Keyboard → Keyboard navigation**. In **Safari → Settings → Advanced**, enable **Press Tab to highlight each item on a webpage**. Also record a second run with the reviewer's normal settings; use Option-Tab where appropriate. [Apple Safari keyboard guidance](https://support.apple.com/en-gb/guide/safari/cpsh003/mac)
4. Enable VoiceOver through **System Settings → Accessibility → VoiceOver**, or its configured shortcut (normally Command-F5, potentially with Fn). Here `VO` means the configured VoiceOver modifier, normally Control-Option. Use VO-Right/Left to move and VO-Space to activate; adjust Quick Nav if arrow keys are intercepted. Use the VoiceOver rotor to inspect headings/links/form controls; its current shortcut is VO-Command-Left/Right. Record the actual configured command rather than treating an older web-rotor shortcut as universal. [Apple VoiceOver rotor](https://support.apple.com/en-gb/guide/voiceover/mchlp2719/mac)

## Required observations

| Workflow | Expected observation to record verbatim |
| --- | --- |
| Profile | One clear page heading. Each Vegetarian, Vegan and Nut-Free switch has a distinct name and announced on/off state. VO-Space changes it once. The saved/session-only status is announced without moving focus or repeating indefinitely. Saved preferences are not presented as automatically active menu filters. |
| Goals | Protein/Carbs/Fat goal fields announce their label and grams. Enter 100, edit/reset, navigate to plate and back. Values, clamped goal bars and numeric overage are understandable without relying on color. |
| Menu navigation | Open local `/hall/busch`. Reach meal tabs, Full menu, search and station choices with keyboard/rotor. Both Synthetic rice portions remain distinguishable. Adding each announces an actionable control; unknown values and supplied zero are distinct. |
| Plate dialog | Activate “View your plate.” VoiceOver identifies the My Plate dialog and temporary-plate description; focus starts at Close plate. Traverse every control forward and backward. Focus stays in the modal, and background links are not available as active controls. Test Escape and Close; focus returns to the opener. |
| Quantity/removal | Each action announces the food and portion. Increase/decrease and remove with keyboard; changed quantity/totals are discoverable without guessing which identical food was changed. Removing the focused row must leave a sensible focus location. Record any silent update or lost-focus issue rather than assuming the passing DOM test covers it. |
| Clear/reset | Clear plate and local data, navigate and reload. The plate stays temporary, preferences stay cleared, and feedback is announced accurately. No actual analytics or hosting deletion claim should be heard. |
| Unavailable | Open local `/hall/neilson`. Hear a clear unavailable heading and requested Rutgers date, with no sample-food controls or closure claim. |
| Layout/visual focus | At 200% Safari page zoom and then a narrow window, inspect profile, plate, modal and every hall map/menu mode. No lost controls or overlapping labels. Test macOS system zoom separately; CSS font enlargement is not equivalent. Repeat with Reduce Motion on and keyboard focus visible. |
| Contrast | Measure text against its actual composited background, including muted/status text, quantity controls, selected/unselected switches, focus indicators, map/photo overlays and disabled states. Record normal/hover/focus/selected results, font size and colors. Use applicable WCAG contrast requirements; the existing engine tests are not a full contrast audit. |

Blocked/quota/legacy/future storage states are already automated. A manual storage-denial check must use an isolated browser setup that actually denies writes; private browsing alone is not proof of denial. Do not change the user's ordinary browser storage settings for the test.

For each row record pass/fail, exact spoken wording, focus before/after, screenshot or short recording if consented, and an issue with reproduction steps for any failure. Restore temporary zoom, VoiceOver and keyboard settings afterward. A knowledgeable accessibility reviewer must sign off on spoken announcements and remaining map/photo contrast before calling this manual gate complete.
