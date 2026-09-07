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
    <button type="button" onClick={() => openSearch(scope)} className={cn("ledger-focus text-left", className)}>
      {label}
    </button>
  )
}
