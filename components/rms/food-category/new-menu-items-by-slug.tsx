'use client'

import { memo, useState, useMemo } from 'react'
import {
  AlertCircle,
  ChevronRight,
  LayoutGrid,
  UtensilsCrossed,
  Search,
  ArrowUpDown,
  ChevronDown,
  Hash,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { useGetFoodCategoriesBySlug } from '@/utils/hooks/tanstack-query/query-hook/food-category/use-get-all-food-by-slug'
import NewMenuItemsPage from './new-menu-item-lists'
import AddMenuItems from './new-add-menu-items'
import Link from 'next/link'
import { Input } from '@/components/ui/input'

interface MenuItemsBySlugProps {
  slug: string
}

function formatSlug(slug: string | string[]) {
  const s = Array.isArray(slug) ? slug[slug.length - 1] : slug
  return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

type FilterTab = 'all' | 'active' | 'off'
type SortOrder = 'order' | 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'

function MenuItemsBySlug({ slug }: MenuItemsBySlugProps) {
  const { data, isLoading, isError, refetch } = useGetFoodCategoriesBySlug(slug)
  const menu_items = data?.menu_items || []
  const categoryName = formatSlug(slug)

  const [searchTerm, setSearchTerm] = useState('')
  const [filterTab, setFilterTab] = useState<FilterTab>('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('order')

  const filteredItems = useMemo(() => {
    let items = [...menu_items]
    if (filterTab === 'active') items = items.filter((i) => i.is_available)
    if (filterTab === 'off') items = items.filter((i) => !i.is_available)
    if (searchTerm) items = items.filter((i) => i.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    items.sort((a, b) => {
      switch (sortOrder) {
        case 'name-asc': return (a.name || '').localeCompare(b.name || '')
        case 'name-desc': return (b.name || '').localeCompare(a.name || '')
        case 'price-asc': return Number(a.price) - Number(b.price)
        case 'price-desc': return Number(b.price) - Number(a.price)
        default: return (a.display_order ?? 0) - (b.display_order ?? 0)
      }
    })
    return items
  }, [menu_items, filterTab, searchTerm, sortOrder])

  const availableCount = menu_items.filter((i) => i.is_available).length
  const unavailableCount = menu_items.filter((i) => !i.is_available).length

  if (!slug) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
          <AlertCircle className="h-4 w-4 text-destructive" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Error</p>
          <p className="text-xs text-muted-foreground">No category slug found</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Hero skeleton */}
        <div className="rounded-2xl border border-border bg-card px-7 py-6 shadow-sm animate-pulse">
          <div className="space-y-3">
            <div className="w-48 h-8 rounded-full bg-muted" />
            <div className="w-36 h-4 rounded-full bg-muted" />
            <div className="flex gap-8 mt-3">
              <div className="w-16 h-8 rounded bg-muted" />
              <div className="w-16 h-8 rounded bg-muted" />
              <div className="w-16 h-8 rounded bg-muted" />
            </div>
          </div>
        </div>
        {/* Filter bar skeleton */}
        <div className="rounded-2xl border border-border bg-card px-5 py-3.5 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-9 rounded-xl bg-muted" />
            <div className="w-40 h-9 rounded-xl bg-muted" />
            <div className="w-36 h-9 rounded-xl bg-muted" />
          </div>
        </div>
        {/* Table skeleton */}
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-5 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-sm p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 scale-110 rounded-3xl border border-destructive/20" />
            <div className="relative w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-foreground">Failed to load</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
            Could not load items for this category.
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 h-8 px-4 rounded-xl text-xs font-medium border border-border bg-muted/30 hover:bg-muted/60 text-foreground transition-colors cursor-pointer"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* ── Hero card: title + breadcrumb + inline KPI stats + Add button ── */}
      <div className="relative rounded-2xl border border-border bg-card px-7 py-6 shadow-sm overflow-hidden">
        {/* Gold radial glow top-right */}
        <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-[radial-gradient(circle,oklch(0.75_0.12_85)/10%,transparent_70%)]" />
        {/* Bottom gold line */}
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

        <div className="relative z-10">

          {/* Top row: title + Add Items button */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              {/* Accent bar + heading */}
              <div className="flex items-center gap-2.5 mb-1.5">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="inline-block w-1 h-5 rounded-full bg-accent" />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
                      Menu Management
                    </p>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Food Category
                    <span className="text-muted-foreground font-normal text-xl ml-2">/{categoryName}</span>
                  </h1>
                </div>
              </div>
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-xs text-muted-foreground ml-3.5">
                <Link
                  href="/food-category"
                  className="flex items-center gap-1 hover:text-accent transition-colors cursor-pointer"
                >
                  <LayoutGrid className="h-3 w-3" />
                  <span>All Categories</span>
                </Link>
                <ChevronRight className="h-3 w-3 text-border" />
                <span className="text-foreground font-medium">{categoryName}</span>
              </nav>
            </div>

            {/* Add Items button */}
            <div className="shrink-0">
              <AddMenuItems slug={slug} compact />
            </div>
          </div>

          {/* Inline KPI stats row */}
          <div className="flex items-center gap-8 mt-4 ml-3.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                <Hash className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground leading-none">Total</p>
                <p className="text-xl font-bold text-foreground leading-tight">{menu_items.length}</p>
              </div>
            </div>

            <div className="w-px h-8 bg-border" />

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground leading-none">Available</p>
                <p className="text-xl font-bold text-foreground leading-tight">{availableCount}</p>
              </div>
            </div>

            <div className="w-px h-8 bg-border" />

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/15 flex items-center justify-center shrink-0">
                <XCircle className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground leading-none">Off</p>
                <p className="text-xl font-bold text-foreground leading-tight">{unavailableCount}</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Filter / Search Toolbar ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">

          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm bg-muted/30 focus:bg-background border-border rounded-xl transition-colors"
            />
          </div>

          {/* Segmented filter: All / Active / Off */}
          <div className="flex items-center rounded-xl border border-border bg-muted/40 p-0.5 gap-0.5">
            {([
              { key: 'all', label: `All (${menu_items.length})` },
              { key: 'active', label: `Active (${availableCount})` },
              { key: 'off', label: `Off (${unavailableCount})` },
            ] as { key: FilterTab; label: string }[]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterTab(tab.key)}
                className={`px-3 h-7 text-[11px] font-medium rounded-lg transition-all cursor-pointer ${filterTab === tab.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="pl-9 pr-8 h-9 bg-muted/40 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none cursor-pointer"
            >
              <option value="order">Order ↑</option>
              <option value="name-asc">Name (A–Z)</option>
              <option value="name-desc">Name (Z–A)</option>
              <option value="price-asc">Price ↑</option>
              <option value="price-desc">Price ↓</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          </div>

        </div>
      </div>

      {/* ── Table or empty state ─────────────────────────────────────────── */}
      {menu_items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card shadow-sm p-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 scale-110 rounded-3xl border border-border/40" />
              <div className="relative w-16 h-16 rounded-2xl bg-muted/60 border border-border flex items-center justify-center">
                <UtensilsCrossed className="h-7 w-7 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-sm font-semibold text-foreground">No Menu Items Found</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              This category doesn't have any menu items yet.
            </p>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card shadow-sm p-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 scale-110 rounded-3xl border border-border/40" />
              <div className="relative w-16 h-16 rounded-2xl bg-muted/60 border border-border flex items-center justify-center">
                <Search className="h-7 w-7 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-sm font-semibold text-foreground">No results found</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              No items match your current filter. Try adjusting your search.
            </p>
            <button
              onClick={() => { setSearchTerm(''); setFilterTab('all') }}
              className="mt-1 inline-flex items-center gap-1.5 h-8 px-4 rounded-xl text-xs font-medium text-accent hover:bg-accent/10 transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        </div>
      ) : (
        <NewMenuItemsPage menuItems={filteredItems} slugs={slug} />
      )}

    </div>
  )
}

export default memo(MenuItemsBySlug)