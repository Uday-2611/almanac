"use client"

import { useMediaSearch } from "@/components/search/media-search-provider"
import { cn } from "@/lib/utils"
import type { SearchScope } from "@/lib/search/catalog"

type SearchTriggerProps = {
  label: string
  scope?: SearchScope
  className?: string
}

export function SearchTrigger({ label, scope = "all", className }: SearchTriggerProps) {
  const { openSearch } = useMediaSearch()

  return (
    <button
      type="button"
      onClick={() => openSearch(scope)}
      className={cn(
        "ledger-focus relative text-left after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-center after:scale-x-0 after:bg-current after:transition-transform after:duration-150 after:ease-in-out hover:after:scale-x-100 focus-visible:after:scale-x-100 motion-reduce:after:transition-none",
        className,
      )}
    >
      {label}
    </button>
  )
}
