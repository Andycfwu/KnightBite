import Link from "next/link";

import { EmptyState } from "@/components/ui/EmptyState";

export default function HallNotFound() {
  return (
    <main className="space-y-4">
      <Link href="/" className="text-sm font-medium text-brand">
        ← Back to halls
      </Link>
      <EmptyState title="Couldn’t load this hall’s menu." description="Try going back and selecting a Rutgers dining hall again." />
    </main>
  );
}
