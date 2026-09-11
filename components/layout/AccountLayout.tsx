"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Route } from "next";
import { KnightBiteBrand } from "@/components/layout/KnightBiteBrand";
import { DiningIcon } from "@/components/ui/DiningIcon";
import { PlateIcon } from "@/components/ui/PlateIcon";
import { usePlate } from "@/hooks/usePlate";

export function AccountLayout({ active, children }: { active: "plate" | "profile"; children: ReactNode }) {
  const { totalItems } = usePlate();
  const links = [
    { href: "/", label: "Campus halls", mobile: "Halls", icon: <DiningIcon name="halls" />, key: "halls" },
    { href: "/#dining-halls", label: "Maps & menus", mobile: "Maps & menus", icon: <DiningIcon name="map" />, key: "menus" },
    { href: "/plate", label: "My plate", mobile: "My plate", icon: <PlateIcon />, key: "plate" },
    { href: "/profile", label: "Profile", mobile: "Profile", icon: <DiningIcon name="user" />, key: "profile" }
  ] satisfies { href: Route; label: string; mobile: string; icon: ReactNode; key: string }[];

  return (
    <div className="account-page">
      <header className="livi-topbar account-topbar">
        <KnightBiteBrand />
        <nav className="account-desktopNav" aria-label="Main navigation">
          {links.map((link) => <Link key={link.href} href={link.href} aria-current={link.key === active ? "page" : undefined}>{link.label}</Link>)}
        </nav>
        <Link href="/plate" className="account-headerPlate" aria-label={`Your plate, ${totalItems} item${totalItems === 1 ? "" : "s"}`}>
          <PlateIcon /><span>Your plate</span><b>{totalItems}</b>
        </Link>
        <Link href="/profile" className="account-avatar" aria-label="Your profile" aria-current={active === "profile" ? "page" : undefined}><DiningIcon name="user" /></Link>
      </header>
      <main className="account-content">{children}</main>
      <footer className="account-footer"><span>KnightBite · Make your next meal yours.</span><Link href="/privacy">Data & privacy</Link></footer>
      <nav className="account-mobileNav" aria-label="Main navigation">
        {links.map((link) => <Link key={link.href} href={link.href} aria-current={link.key === active ? "page" : undefined}>
          <span className="account-navIcon">{link.icon}{link.key === "plate" && totalItems > 0 ? <b>{totalItems}</b> : null}</span><span>{link.mobile}</span>
        </Link>)}
      </nav>
    </div>
  );
}
