"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";

import { addPlateItem } from "@/lib/plate";

import { calculatePlateTotals, getTotalPlateItemCount } from "@/lib/nutrition";
import { MenuItem, PlateTotals, Plate } from "@/lib/types";

export type UsePlateReturn = {
  plate: Plate;
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: string) => void;
  incrementItem: (itemId: string) => void;
  decrementItem: (itemId: string) => void;
  clearPlate: () => void;
  totalItems: number;
  totals: PlateTotals;
};

const PlateContext = createContext<UsePlateReturn | null>(null);

export function PlateProvider({ children }: { children: ReactNode }) {
  const [plate, setPlate] = useState<Plate>({ items: [] });

  const addItem = (item: MenuItem) => {
    setPlate((current) => ({ items: addPlateItem(current.items, item) }));
  };

  const removeItem = (itemId: string) => {
    setPlate((current) => ({
      items: current.items.filter((item) => item.itemId !== itemId)
    }));
  };

  const incrementItem = (itemId: string) => {
    setPlate((current) => ({
      items: current.items.map((item) =>
        item.itemId === itemId ? { ...item, quantity: Math.min(item.quantity + 1, 999) } : item
      )
    }));
  };

  const decrementItem = (itemId: string) => {
    setPlate((current) => ({
      items: current.items
        .map((item) => (item.itemId === itemId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)
    }));
  };

  const clearPlate = () => {
    setPlate({ items: [] });
  };

  const value = useMemo<UsePlateReturn>(
    () => ({
      plate,
      addItem,
      removeItem,
      incrementItem,
      decrementItem,
      clearPlate,
      totalItems: getTotalPlateItemCount(plate.items),
      totals: calculatePlateTotals(plate.items)
    }),
    [plate]
  );

  return <PlateContext.Provider value={value}>{children}</PlateContext.Provider>;
}

export function usePlate(): UsePlateReturn {
  const context = useContext(PlateContext);

  if (!context) {
    throw new Error("usePlate must be used inside PlateProvider.");
  }

  return context;
}
