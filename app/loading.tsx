import { TopNav } from "@/components/layout/TopNav";
import { LoadingState } from "@/components/ui/LoadingState";

export default function Loading() {
  return (
    <main className="space-y-6">
      <TopNav />
      <LoadingState />
    </main>
  );
}
