"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { SignOutLink } from "@/components/auth/sign-out-link";

const navigationItems = [
  { href: "/movies", label: "Movies" },
  { href: "/books", label: "Books" },
  { href: "/colors", label: "Colors" },
  { href: "/texts", label: "Texts" },
  { href: "/settings", label: "My profile" },
] as const;

export function SiteNavigation() {
  const pathname = usePathname();
  const menuId = useId();
  const navigationRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (!navigationRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div ref={navigationRef} className="relative ml-2">
      <button
        type="button"
        className="ledger-focus relative flex h-4 w-4 cursor-pointer items-center justify-center"
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="sr-only">{isOpen ? "Close navigation" : "Open navigation"}</span>
        <span
          aria-hidden="true"
          className={`absolute h-px w-3.5 bg-current transition-transform duration-200 ease-out ${
            isOpen ? "translate-y-0 rotate-45" : "-translate-y-[4px]"
          }`}
        />
        <span
          aria-hidden="true"
          className={`absolute h-px w-3.5 bg-current transition-opacity duration-150 ease-out ${
            isOpen ? "opacity-0" : "opacity-100"
          }`}
        />
        <span
          aria-hidden="true"
          className={`absolute h-px w-3.5 bg-current transition-transform duration-200 ease-out ${
            isOpen ? "translate-y-0 -rotate-45" : "translate-y-[4px]"
          }`}
        />
      </button>

      <nav
        id={menuId}
        aria-label="Primary navigation"
        aria-hidden={!isOpen}
        className={`absolute left-0 top-7 w-44 origin-top-left border border-[#d8d8d8] bg-white p-1 transition-[opacity,transform,visibility] duration-200 ease-out ${
          isOpen
            ? "visible translate-y-0 scale-100 opacity-100"
            : "invisible pointer-events-none -translate-y-1 scale-[0.98] opacity-0"
        }`}
      >
        <ul>
          {navigationItems.map((item, index) => {
            const isCurrent =
              item.href === "/settings"
                ? pathname.startsWith("/settings")
                : pathname.startsWith(item.href);

            return (
              <li key={item.href} className={index === navigationItems.length - 1 ? "mt-1 border-t border-[#e8e8e8] pt-1" : undefined}>
                <Link
                  href={item.href}
                  aria-current={isCurrent ? "page" : undefined}
                  tabIndex={isOpen ? 0 : -1}
                  onClick={() => setIsOpen(false)}
                  className={`ledger-focus group flex min-h-8 items-center px-2.5 text-sm transition-colors duration-150 hover:bg-[#f3f3f3] ${
                    isCurrent ? "font-medium text-[#111111]" : "text-[#686868] hover:text-[#111111]"
                  }`}
                >
                  <span className="transition-transform duration-150 ease-out group-hover:translate-x-1 group-focus-visible:translate-x-1">
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
          <li>
            <SignOutLink onSignedOut={() => setIsOpen(false)} tabIndex={isOpen ? 0 : -1} />
          </li>
        </ul>
      </nav>
    </div>
  );
}
