"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";

import { calculatePlateTotals, getTotalPlateItemCount } from "@/lib/nutrition";
import { MenuItem, Nutrition, Plate, PlateItem } from "@/lib/types";

export type UsePlateReturn = {
  plate: Plate;
  addItem: (item: MenuItem) => void;
  removeItem: (itemId: string) => void;
  incrementItem: (itemId: string) => void;
  decrementItem: (itemId: string) => void;
  clearPlate: () => void;
  totalItems: number;
  totals: Nutrition;
};

const PlateContext = createContext<UsePlateReturn | null>(null);

function toPlateItem(item: MenuItem): PlateItem {
  return {
    itemId: item.id,
    name: item.name,
    quantity: 1,
    servingSize: item.servingSize,
    nutrition: item.nutrition
  };
}

export function PlateProvider({ children }: { children: ReactNode }) {
  const [plate, setPlate] = useState<Plate>({ items: [] });

  const addItem = (item: MenuItem) => {
    setPlate((current) => {
      const existing = current.items.find((plateItem) => plateItem.itemId === item.id);

      if (!existing) {
        return { items: [...current.items, toPlateItem(item)] };
      }

      return {
        items: current.items.map((plateItem) =>
          plateItem.itemId === item.id ? { ...plateItem, quantity: plateItem.quantity + 1 } : plateItem
        )
      };
    });
  };

  const removeItem = (itemId: string) => {
    setPlate((current) => ({
      items: current.items.filter((item) => item.itemId !== itemId)
    }));
  };

  const incrementItem = (itemId: string) => {
    setPlate((current) => ({
      items: current.items.map((item) =>
        item.itemId === itemId ? { ...item, quantity: item.quantity + 1 } : item
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
