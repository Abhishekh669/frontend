"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, SlidersHorizontal } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const STATUS_OPTIONS = ["all", "active", "inactive", "vip"] as const

export default function ClientFilters() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")

  const hasFilters = search !== "" || status !== "all"

  const handleReset = () => {
    setSearch("")
    setStatus("all")
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">

      {/* Subtle gold radial glow — top-left */}
      <div className="pointer-events-none absolute -top-8 -left-8 w-40 h-40 rounded-full bg-[radial-gradient(circle,var(--color-accent)/10%,transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-full h-px bg-gradient-to-l from-transparent via-accent/20 to-transparent" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        {/* Left — Search + Status Toggle + Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">

          {/* Filter label */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-muted-foreground shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filter
          </div>

          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground transition-colors group-focus-within:text-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone or email…"
              className="h-8 pl-9 pr-3 text-xs w-full sm:w-[240px] rounded-xl border-border bg-muted/40 hover:bg-muted focus:bg-background transition-colors placeholder:text-muted-foreground/60"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Segmented Status Toggle */}
          <div className="flex items-center rounded-xl border border-border bg-muted/40 p-0.5 gap-0.5">
            {STATUS_OPTIONS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                className={cn(
                  "px-3 h-7 text-[11px] font-medium rounded-lg transition-all duration-150 capitalize",
                  status === value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {value}
              </button>
            ))}
          </div>

          {/* Reset */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 text-xs rounded-xl text-muted-foreground hover:text-foreground gap-1.5 px-3"
            >
              <X className="w-3.5 h-3.5" />
              Reset
            </Button>
          )}
        </div>

        {/* Right — Result count */}
        <div className="text-xs text-muted-foreground">
          Showing{" "}
          <span className="font-semibold text-foreground">124</span>{" "}
          results
        </div>

      </div>
    </div>
  )
}