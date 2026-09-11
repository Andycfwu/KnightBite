import Link from "next/link";

export default function PrivacyPage() {
  return <main className="space-y-5 text-ink">
    <h1 className="text-3xl font-semibold">Data and privacy</h1>
    <p>KnightBite is an informational dining tool. It does not collect Rutgers passwords or provide allergy-safety assurances. Check dietary and allergen questions with Rutgers dining staff.</p>
    <h2 className="text-xl font-semibold">Your browser data</h2>
    <p>Dietary preferences and optional plate goals are saved in this browser’s local storage. They remain until you clear them, and other people using the same browser profile can see them. Your plate stays in memory and clears on reload. KnightBite does not send your plate or saved preferences to its application server.</p>
    <p>Use “Clear local data” on your profile to remove the saved preference record and reset this plate. If storage is blocked, your browser’s site-data controls can remove it. Browser deletion does not remove hosting or analytics records.</p>
    <h2 className="text-xl font-semibold">Site usage and menus</h2>
    <p>Vercel Web Analytics is enabled for site usage measurement. KnightBite does not add plate items, dietary preferences or goals to analytics events. Hosting and analytics services can process request and usage information separately from your browser preferences.</p>
    <p><a className="underline" href="https://vercel.com/docs/analytics/privacy-policy" target="_blank" rel="noreferrer">Read Vercel’s analytics privacy documentation</a>. Provider documentation describes its service; it does not specify KnightBite’s account retention settings.</p>
    <p>Menus are retrieved from public Rutgers services. Operational ingestion logs contain hall/date/status and aggregate counts, without menu bodies or browser preferences.</p>
    <Link href="/profile" className="inline-block underline">Back to profile and data controls</Link>
  </main>;
}
