"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ModulesIcon, RestaurantIcon, SettingsIcon } from "@darb/icons";

import styles from "./restaurant.module.css";

export function RestaurantSubnav({ businessSlug }: { businessSlug: string }) {
  const pathname = usePathname();
  const base = `/b/${businessSlug}/restaurant`;
  const items = [
    { href: base, icon: RestaurantIcon, label: "Overview" },
    { href: `${base}/menus`, icon: ModulesIcon, label: "Menus & items" },
    { href: `${base}/modifiers`, icon: SettingsIcon, label: "Modifier library" },
  ];

  return (
    <nav className={styles.subnav} aria-label="Restaurant administration">
      {items.map((item) => {
        const active = item.href === base ? pathname === base : pathname.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}>
            <item.icon size={17} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
