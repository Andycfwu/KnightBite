"use client";

import { TouchEvent, useEffect, useRef, useState } from "react";

import { MacroTotals } from "@/components/plate/MacroTotals";
import { PlateItemRow } from "@/components/plate/PlateItemRow";
import { PlateSummary } from "@/components/plate/PlateSummary";
import { EmptyState } from "@/components/ui/EmptyState";
import { NutritionDisclaimer } from "@/components/ui/NutritionDisclaimer";
import { hasCompleteNutrition, formatTotal } from "@/lib/nutrition";
import { Nutrition, Plate } from "@/lib/types";

type PlateDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plate: Plate;
  totals: Nutrition;
  totalItems: number;
  onIncrement: (itemId: string) => void;
  onDecrement: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  onClear: () => void;
};

export function PlateDrawer({
  open,
  onOpenChange,
  plate,
  totals,
  totalItems,
  onIncrement,
  onDecrement,
  onRemove,
  onClear
}: PlateDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [isRendered, setIsRendered] = useState(open);
  const [dragDelta, setDragDelta] = useState(0);
  const [snapPoint, setSnapPoint] = useState<"mid" | "full">("mid");
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const startYRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startScrollTopRef = useRef(0);
  const draggingSheetRef = useRef(false);
  const lockedScrollYRef = useRef(0);

  useEffect(() => {
    if (open) {
      setIsRendered(true);
      setSnapPoint("mid");
      return;
    }

    const timer = window.setTimeout(() => setIsRendered(false), 240);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && isRendered && !dialog.open) {
      dialog.showModal();
      closeRef.current?.focus();
    } else if (!open && dialog.open) dialog.close();
    return () => { if (dialog.open) dialog.close(); };
  }, [open, isRendered]);

  useEffect(() => {
    if (!open) return;

    const html = document.documentElement;
    const body = document.body;
    lockedScrollYRef.current = window.scrollY;

    html.classList.add("sheet-open");
    body.classList.add("sheet-open");
    body.style.position = "fixed";
    body.style.top = `-${lockedScrollYRef.current}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    body.style.touchAction = "none";

    return () => {
      html.classList.remove("sheet-open");
      body.classList.remove("sheet-open");
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
      body.style.touchAction = "";
      window.scrollTo({ top: lockedScrollYRef.current, behavior: "instant" as ScrollBehavior });
    };
  }, [open]);

  const handleStart = (clientY: number, source: "handle" | "content") => {
    startYRef.current = clientY;
    startTimeRef.current = performance.now();
    startScrollTopRef.current = scrollContainerRef.current?.scrollTop ?? 0;
    draggingSheetRef.current = source === "handle";
  };

  const handleMove = (event: TouchEvent<HTMLDivElement>, clientY: number, source: "handle" | "content") => {
    if (startYRef.current === null) return;
    const delta = clientY - startYRef.current;
    const scrollTop = scrollContainerRef.current?.scrollTop ?? 0;

    if (!draggingSheetRef.current) {
      if (source === "handle") {
        draggingSheetRef.current = true;
      } else if (delta > 0 && startScrollTopRef.current <= 0 && scrollTop <= 0) {
        draggingSheetRef.current = true;
      } else {
        return;
      }
    }

    event.preventDefault();
    const resistedDelta = delta > 0 ? delta : delta * 0.3;
    setDragDelta(resistedDelta);
  };

  const handleEnd = () => {
    if (startYRef.current === null) return;

    if (draggingSheetRef.current) {
      const elapsed = Math.max(performance.now() - startTimeRef.current, 1);
      const velocity = dragDelta / elapsed;
      const current = snapPoint === "full" ? 8 : 42;
      const projected = current + dragDelta / 6 + velocity * 220;

      if (projected > 74) {
        onOpenChange(false);
      } else if (projected > 24) {
        setSnapPoint("mid");
      } else {
        setSnapPoint("full");
      }
    }

    setDragDelta(0);
    startYRef.current = null;
    draggingSheetRef.current = false;
  };

  if (!isRendered) return null;

  const baseTranslate = snapPoint === "full" ? 6 : 40;
  const translateY = open ? Math.min(Math.max(baseTranslate + dragDelta / 6, 4), 100) : 100;
  const showNutritionDisclaimer = plate.items.some((item) => item.isCustom || !hasCompleteNutrition(item.nutrition));

  return (
    <dialog ref={dialogRef} aria-labelledby="plate-dialog-title" aria-describedby="plate-lifecycle"
      onCancel={(event) => { event.preventDefault(); onOpenChange(false); }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        // Safari can skip every button when full keyboard navigation is off.
        // Move through all dialog controls explicitly, retaining native inertness.
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]'
        )).filter((node) => node.tabIndex >= 0 && node.getClientRects().length > 0 && node.getAttribute("aria-hidden") !== "true");
        if (!controls.length) return;
        const current = controls.indexOf(document.activeElement as HTMLElement);
        const next = current < 0 ? (event.shiftKey ? controls.length - 1 : 0)
          : (current + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
        event.preventDefault();
        controls[next].focus();
      }}
      className="fixed inset-0 z-50 m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-0 text-ink">
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        className={`sheet-transition absolute inset-0 ${open ? "pointer-events-auto bg-black/32 opacity-100" : "bg-black/0 opacity-0"}`}
        onClick={() => onOpenChange(false)}
      />
      <div className="pointer-events-auto absolute inset-x-0 bottom-0 mx-auto max-w-[430px]">
        <div
          style={{ transform: `translateY(${translateY}%)` }}
          className="sheet-transition flex max-h-[92vh] flex-col overflow-hidden rounded-t-[34px] border border-black/8 bg-[#fafafa] px-4 pb-4 pt-2 shadow-[0_-24px_50px_rgba(23,23,23,0.18)]"
        >
          <div
            className="sticky top-0 z-10 -mx-4 border-b border-black/6 bg-[#fafafa]/96 px-4 pb-3 pt-1 backdrop-blur-xl"
            onTouchStart={(event) => handleStart(event.touches[0].clientY, "handle")}
            onTouchMove={(event) => handleMove(event, event.touches[0].clientY, "handle")}
            onTouchEnd={handleEnd}
            onTouchCancel={handleEnd}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="plate-dialog-title" className="sr-only">My Plate</h2>
              <p id="plate-lifecycle" className="text-xs text-ink/65">Temporary plate · clears on reload</p>
              <button ref={closeRef} type="button" aria-label="Close plate" onClick={() => onOpenChange(false)} className="rounded-full px-3 py-2 text-sm font-medium">Close</button>
            </div>
            <PlateSummary totalItems={totalItems} totalCalories={formatTotal(totals, "calories", " kcal")} />
            <div className="mt-3 flex items-center justify-between gap-3">
              <MacroTotals totals={totals} variant="inline" />
              {plate.items.length > 0 ? (
                <button type="button" onClick={onClear} className="shrink-0 text-sm font-medium text-ink/45">
                  Clear
                </button>
              ) : null}
            </div>
            {showNutritionDisclaimer ? <NutritionDisclaimer className="mt-2" /> : null}
          </div>

          <div
            ref={scrollContainerRef}
            className="mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain"
            onTouchStart={(event) => handleStart(event.touches[0].clientY, "content")}
            onTouchMove={(event) => handleMove(event, event.touches[0].clientY, "content")}
            onTouchEnd={handleEnd}
            onTouchCancel={handleEnd}
          >
            <div className="space-y-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
              {plate.items.length > 0 ? (
                plate.items.map((item) => (
                  <PlateItemRow
                    key={item.itemId}
                    item={item}
                    onIncrement={onIncrement}
                    onDecrement={onDecrement}
                    onRemove={onRemove}
                  />
                ))
              ) : (
                <EmptyState
                  title="Your plate is empty"
                  description="Add a few menu items to build a plate and watch the totals update live."
                  compact
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
