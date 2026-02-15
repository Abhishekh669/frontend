"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Utensils, Plus, ChefHat, Sparkles, Search, ArrowUpDown } from "lucide-react"
import { User } from "@/utils/types/user.types"
import { Category } from "@/utils/types/food-category.types"
import { useGetFoodCategories } from "@/utils/hooks/tanstack-query/query-hook/food-category/use-get-all-food-category"
import { createFoodCategory, NewCatType } from "@/utils/actions/food-category/food-category.post"
import { useCreateFoodCategory } from "@/utils/hooks/tanstack-query/mutate-hook/food-category/use-create-food-category"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { error } from "console"
import { getErrorMessage } from "@/utils/helper/get-error-message"

type SortType = "name-asc" | "name-desc" | "date-newest" | "date-oldest" | "active"

function FoodManagementPage({ user }: { user: User }) {
  const router = useRouter()
  const [catName, setCatName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortType>("date-newest")
  const { data, isLoading, isError } = useGetFoodCategories()
  const { mutate: create_food_category, isPending } = useCreateFoodCategory();
  const queryClient = useQueryClient();


  const categories: Category[] = useMemo(() => {
    if (isLoading) return []
    if (data?.categories) {
      return data.categories
    }
    return []
  }, [data, isLoading])

  const createCategory = async () => {
    if (isPending) return;
    try {
      const data: NewCatType = {
        category_name: catName,
        slug_path: [],
      }
      create_food_category(data, {
        onSuccess: (res) => {
          if (res.message && res.success) {
            queryClient.invalidateQueries({ queryKey: ["get-all-categories"] });
            toast.success(res.message)
            setCatName("")
          }
        },
        onError : (err) =>{
          toast.success(err.message   || "failed to create category")
        }
      })
    } catch (error) {
      toast.error(getErrorMessage(error as string || "failed to create user"))
    }
  }

  const handleVisit = (slug: string) => {
    router.push(`/food-category/${slug}`)
  }

  const filteredAndSortedCategories = useMemo(() => {
    let filtered = categories.filter((cat: Category) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return filtered.sort((a: Category, b: Category) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name)
        case "name-desc":
          return b.name.localeCompare(a.name)
        case "date-newest":
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          )
        case "date-oldest":
          return (
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
          )
        case "active":
          return (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0)
        default:
          return 0
      }
    })
  }, [categories, searchQuery, sortBy])

  // Handle error state
  if (isError) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <Utensils className="w-12 h-12 mx-auto text-destructive" />
          <h2 className="text-2xl font-light">Failed to load categories</h2>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Premium Header Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-background via-background to-transparent pb-12 pt-16">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          {/* Decorative Elements */}
          <div className="pointer-events-none absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-40 w-60 h-60 bg-accent/5 rounded-full blur-3xl" />

          {/* Header Content */}
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/15 rounded-xl backdrop-blur-sm">
                <ChefHat className="w-7 h-7 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-4xl sm:text-5xl font-light tracking-tight text-balance">
                  Food Categories
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Organize and manage your culinary collection
                </p>
              </div>
            </div>
          </div>

          {/* Input Section */}
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row gap-3 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
              <Input
                placeholder="Enter new category name..."
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && createCategory()}
                className="flex-1 h-11 text-base border-border/50 bg-background/50 rounded-lg"
              />
              <Button
                onClick={createCategory}
                disabled={catName.trim().length <= 2 || isPending}
                className="sm:w-40 h-11 gap-2 font-medium rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {
                  isPending ? (
                    <>
                      Adding Category...
                    </>
                  ) :
                    (
                      <>
                        <Plus className="w-4 h-4" strokeWidth={2} />
                        Add Category
                      </>
                    )
                }
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-6 pb-10">
        <div className="space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-light tracking-tight">
                Your Categories
              </h2>
              <p className="text-sm text-muted-foreground">
                Manage {filteredAndSortedCategories.length} of {categories.length} categories
              </p>
            </div>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary" strokeWidth={1.5} />
            </div>
          </div>

          {/* Toolbar (Sticky) */}
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border border-border/50 rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row gap-3">

              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by category name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-background/50 border-border/50 rounded-lg"
                />
              </div>

              {/* Sort */}
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className="pl-10 pr-4 h-10 bg-background/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="date-newest">Newest First</option>
                  <option value="date-oldest">Oldest First</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="active">Active First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Scrollable Categories Area */}
          <div className="max-h-96 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary/40 [&::-webkit-scrollbar-thumb]:rounded-lg">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="h-56 bg-muted/40 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filteredAndSortedCategories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredAndSortedCategories.map((cat: Category) => (
                  <Card
                    key={cat.id}
                    onClick={() => handleVisit(cat.slug)}
                    className="cursor-pointer border border-border/50 bg-card/40 hover:bg-card/60 transition-all duration-300 hover:scale-[1.02] rounded-2xl group"
                  >
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="flex-1 space-y-3">
                        <div className="flex justify-between">
                          <h3 className="text-lg font-light group-hover:text-primary transition-colors">
                            {cat.name}
                          </h3>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${cat.is_active
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground"
                              }`}
                          >
                            {cat.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <p className="text-xs font-mono bg-muted/40 px-2 py-1 rounded-lg w-fit">
                          /{cat.slug}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        className="mt-4 w-full gap-2 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      >
                        Visit
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border border-border/50 bg-card/40 rounded-2xl">
                <CardContent className="p-16 text-center">
                  <Utensils className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {searchQuery ? "No categories match your search." : "No categories found. Create your first one!"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default FoodManagementPage
