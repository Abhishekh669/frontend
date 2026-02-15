"use client"

import React, { useState, ChangeEvent, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, FolderPlus, Utensils, X, Plus, Copy, Trash2, Loader2 } from "lucide-react"
import { useCreateFoodCategory } from "@/utils/hooks/tanstack-query/mutate-hook/food-category/use-create-food-category"
import { NewCatType } from "@/utils/actions/food-category/food-category.post"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { useUploadThing } from "@/utils/uploadthing/uploadthing-client"
import { removeMultipleImages } from "@/utils/actions/uploadthing/delete-images"
import { useCreateMenuItems } from "@/utils/hooks/tanstack-query/mutate-hook/food-category/use-create-menu-items"
import { CreateMenuItems, CreateMenuItemType } from "@/utils/types/food-category.types"
import { Skeleton } from "@/components/ui/skeleton"
import { useGetFoodCategoriesBySlug } from "@/utils/hooks/tanstack-query/query-hook/food-category/use-get-all-food-by-slug"

export interface MenuItem {
    id: string
    name: string
    description?: string | null
    price: number
    category_id: string
    is_available: boolean
    image_url?: string | null
    display_order: number
    created_at: Date
    updated_at: Date
}

interface MenuItemForm {
    name: string
    description: string
    price: string
    display_order: number
    is_available: boolean
    imagePreview: string | null
    imageUrl: string | null
    imageFile: File | null
    isUploading: boolean
    uploadError: string | null
    id: string
    uploadedAt?: number // timestamp for tracking
}

interface StoredMenuItem {
    name: string
    description: string
    price: string
    display_order: number
    is_available: boolean
    imagePreview: string | null
    imageUrl: string | null
    id: string
    uploadedAt?: number
}

// Helper function to get route-specific storage keys
const getStorageKeys = (routePath: string) => ({
    menuItems: `menu_items_draft_${routePath}`,
    imageUrls: `uploaded_image_urls_${routePath}`
});

export default function AddCategoryNMenuPage({ slugs, parentId }: { slugs: string[], parentId: string | null }) {
    const [open, setOpen] = useState(false)
    const [mode, setMode] = useState<"category" | "menu" | null>(null)
    const { startUpload } = useUploadThing("imageUploader")
    
    // Get current route path for storage keys
    const currentRoutePath = slugs.join('/');
    const storageKeys = getStorageKeys(currentRoutePath);

    // Category state
    const [catName, setCatName] = useState("")

    // Multi Menu state - array of menu items
    const [menuItems, setMenuItems] = useState<MenuItemForm[]>([])
    const [draftCount, setDraftCount] = useState(0)

    // Track all uploaded image URLs for cleanup
    const [uploadedImageUrls, setUploadedImageUrls] = useState<Set<string>>(new Set())

    // Fetch categories data to get category names
    const { data: categoriesData, isLoading: categoriesLoading } = useGetFoodCategoriesBySlug(currentRoutePath)
    console.log("this is categoreis data in add category and menu : ",categoriesData)

    const { mutate: create_menu_items, isPending: creatingMenu } = useCreateMenuItems();
    
    // Load from localStorage on mount or when route changes
    useEffect(() => {
        const savedItems = localStorage.getItem(storageKeys.menuItems)
        const savedImageUrls = localStorage.getItem(storageKeys.imageUrls)

        // Load saved image URLs
        if (savedImageUrls) {
            try {
                const urls = JSON.parse(savedImageUrls)
                setUploadedImageUrls(new Set(urls))
            } catch (error) {
                console.error("Failed to restore image URLs:", error)
            }
        }

        // Load saved menu items
        if (savedItems) {
            try {
                const parsed = JSON.parse(savedItems)
                const restoredItems = parsed.map((item: any) => ({
                    ...item,
                    imageFile: null,
                    isUploading: false,
                    uploadError: null,
                }))
                setMenuItems(restoredItems)
                setDraftCount(restoredItems.filter((item: MenuItemForm) =>
                    item.name.trim() || item.price || item.imageUrl
                ).length)
            } catch (error) {
                console.error("Failed to restore draft:", error)
                localStorage.removeItem(storageKeys.menuItems)
            }
        } else {
            // Reset if no data for this route
            resetToEmptyMenu();
            setUploadedImageUrls(new Set());
        }

        // Cleanup function for when route changes
        return () => {
            // Optional: Clear state when unmounting
            setMenuItems([]);
            setDraftCount(0);
        };
    }, [currentRoutePath]) // Re-run when route changes

    // Cleanup orphaned images on mount
    useEffect(() => {
        const cleanupOrphanedImages = async () => {
            const savedItems = localStorage.getItem(storageKeys.menuItems)
            const savedImageUrls = localStorage.getItem(storageKeys.imageUrls)

            if (!savedImageUrls) return

            try {
                const allStoredUrls = JSON.parse(savedImageUrls) as string[]
                const currentUrls = new Set<string>()

                // Collect all image URLs from current menu items
                if (savedItems) {
                    const parsed = JSON.parse(savedItems)
                    parsed.forEach((item: any) => {
                        if (item.imageUrl) {
                            currentUrls.add(item.imageUrl)
                        }
                    })
                }

                // Find orphaned URLs (stored but not in current items)
                const orphanedUrls = allStoredUrls.filter(url => !currentUrls.has(url))

                if (orphanedUrls.length > 0) {
                    console.log("Cleaning up orphaned images:", orphanedUrls)
                    await removeMultipleImages(orphanedUrls)

                    // Update stored URLs
                    const remainingUrls = allStoredUrls.filter(url => currentUrls.has(url))
                    localStorage.setItem(storageKeys.imageUrls, JSON.stringify(remainingUrls))
                    setUploadedImageUrls(new Set(remainingUrls))
                }
            } catch (error) {
                console.error("Failed to cleanup orphaned images:", error)
            }
        }

        cleanupOrphanedImages()
    }, [currentRoutePath])

    // Save to localStorage whenever menuItems changes
    useEffect(() => {
        if (menuItems.length > 0 && !menuItems.some(item => item.isUploading)) {
            // Save menu items without File objects
            const itemsToSave = menuItems.map(({ imageFile, ...rest }) => rest)
            localStorage.setItem(storageKeys.menuItems, JSON.stringify(itemsToSave))

            // Update draft count
            const validDraftCount = menuItems.filter(item =>
                item.name.trim() || item.price || item.imageUrl
            ).length
            setDraftCount(validDraftCount)
        }
    }, [menuItems, storageKeys.menuItems])

    // Save image URLs to localStorage whenever the set changes
    useEffect(() => {
        if (uploadedImageUrls.size > 0) {
            localStorage.setItem(storageKeys.imageUrls, JSON.stringify(Array.from(uploadedImageUrls)))
        }
    }, [uploadedImageUrls, storageKeys.imageUrls])

    const { mutate: create_food_category, isPending: creating_category } = useCreateFoodCategory()
    const queryClient = useQueryClient()

    const isDisabled = creating_category || catName.trim().length < 2 || creatingMenu

    const openDialog = (type: "category" | "menu") => {
        setMode(type)
        setOpen(true)

        if (type === "category") {
            setCatName("")
        } else {
            // Load from localStorage for current route
            const savedItems = localStorage.getItem(storageKeys.menuItems)
            if (savedItems) {
                try {
                    const parsed = JSON.parse(savedItems)
                    const restoredItems = parsed.map((item: any) => ({
                        ...item,
                        imageFile: null,
                        isUploading: false,
                        uploadError: null,
                    }))
                    setMenuItems(restoredItems.length > 0 ? restoredItems : getEmptyMenuItem())
                } catch (error) {
                    resetToEmptyMenu()
                }
            } else {
                resetToEmptyMenu()
            }
        }
    }

    const getEmptyMenuItem = () => ([{
        id: crypto.randomUUID(),
        name: "",
        description: "",
        price: "",
        display_order: 0,
        is_available: true,
        imagePreview: null,
        imageUrl: null,
        imageFile: null,
        isUploading: false,
        uploadError: null,
    }])

    const resetToEmptyMenu = () => {
        setMenuItems(getEmptyMenuItem())
    }

    // Clear localStorage after successful submission
    const clearDraft = async () => {
        // Get all image URLs before clearing
        const imageUrls = Array.from(uploadedImageUrls)

        // Clear storage for current route
        localStorage.removeItem(storageKeys.menuItems)
        localStorage.removeItem(storageKeys.imageUrls)

        // Delete images from UploadThing
        if (imageUrls.length > 0) {
            await removeMultipleImages(imageUrls)
        }

        setUploadedImageUrls(new Set())
        setDraftCount(0)
    }

    // Upload image to UploadThing
    const uploadImage = async (file: File, itemId: string) => {
        try {
            // Set uploading state
            setMenuItems(prev =>
                prev.map(item =>
                    item.id === itemId
                        ? { ...item, isUploading: true, uploadError: null }
                        : item
                )
            )

            // Upload the file
            const uploadResponse = await startUpload([file])

            if (uploadResponse && uploadResponse[0]?.ufsUrl) {
                const imageUrl = uploadResponse[0].ufsUrl

                // Add to uploaded URLs set
                setUploadedImageUrls(prev => new Set(prev).add(imageUrl))

                // Update with image URL
                setMenuItems(prev =>
                    prev.map(item =>
                        item.id === itemId
                            ? {
                                ...item,
                                imageUrl: imageUrl,
                                imageFile: null,
                                isUploading: false,
                                uploadError: null,
                                uploadedAt: Date.now(),
                            }
                            : item
                    )
                )
                toast.success("Image uploaded successfully")
            } else {
                throw new Error("Upload failed")
            }
        } catch (error) {
            // Handle upload error
            setMenuItems(prev =>
                prev.map(item =>
                    item.id === itemId
                        ? {
                            ...item,
                            isUploading: false,
                            uploadError: "Failed to upload image",
                            imagePreview: null,
                            imageFile: null,
                            imageUrl: null,
                        }
                        : item
                )
            )
            toast.error("Failed to upload image")
        }
    }

    const handleImageChange = async (e: ChangeEvent<HTMLInputElement>, itemId: string) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setMenuItems(prev =>
                prev.map(item =>
                    item.id === itemId
                        ? {
                            ...item,
                            imageFile: file,
                            imagePreview: reader.result as string,
                        }
                        : item
                )
            )

            // Automatically start upload after preview is set
            uploadImage(file, itemId)
        }
        reader.readAsDataURL(file)
    }

    const clearImage = async (itemId: string) => {
        const item = menuItems.find(i => i.id === itemId)
        const imageUrlToDelete = item?.imageUrl

        setMenuItems(prev =>
            prev.map(item =>
                item.id === itemId
                    ? {
                        ...item,
                        imagePreview: null,
                        imageUrl: null,
                        imageFile: null,
                        isUploading: false,
                        uploadError: null,
                    }
                    : item
            )
        )

        // Remove from uploaded URLs set and delete from UploadThing
        if (imageUrlToDelete) {
            setUploadedImageUrls(prev => {
                const newSet = new Set(prev)
                newSet.delete(imageUrlToDelete)
                return newSet
            })

            // Delete the image from UploadThing
            await removeMultipleImages([imageUrlToDelete])
        }

        // Update localStorage
        setTimeout(() => {
            const itemsToSave = menuItems.map(({ imageFile, ...rest }) => rest)
            localStorage.setItem(storageKeys.menuItems, JSON.stringify(itemsToSave))
        }, 0)
    }

    const addMenuItem = () => {
        if (menuItems.length < 10) {
            const newItem = {
                id: crypto.randomUUID(),
                name: "",
                description: "",
                price: "",
                display_order: 0,
                is_available: true,
                imagePreview: null,
                imageUrl: null,
                imageFile: null,
                isUploading: false,
                uploadError: null,
            }
            setMenuItems(prev => [...prev, newItem])
        }
    }

    const duplicateMenuItem = (itemId: string) => {
        if (menuItems.length < 10) {
            const itemToDuplicate = menuItems.find(item => item.id === itemId)
            if (itemToDuplicate) {
                setMenuItems(prev => [
                    ...prev,
                    {
                        ...itemToDuplicate,
                        id: crypto.randomUUID(),
                        name: `${itemToDuplicate.name} (Copy)`,
                        imageFile: null,
                        isUploading: false,
                        uploadError: null,
                    }
                ])
            }
        }
    }

    const removeMenuItem = async (itemId: string) => {
        const itemToRemove = menuItems.find(i => i.id === itemId)
        const imageUrlToDelete = itemToRemove?.imageUrl

        if (menuItems.length > 1) {
            setMenuItems(prev => {
                const filtered = prev.filter(item => item.id !== itemId)

                // Remove image URL from tracking if it exists
                if (imageUrlToDelete) {
                    setUploadedImageUrls(prevUrls => {
                        const newSet = new Set(prevUrls)
                        newSet.delete(imageUrlToDelete)
                        return newSet
                    })

                    // Delete the image from UploadThing
                    removeMultipleImages([imageUrlToDelete]).catch(console.error)
                }

                // Update localStorage immediately
                const itemsToSave = filtered.map(({ imageFile, ...rest }) => rest)
                localStorage.setItem(storageKeys.menuItems, JSON.stringify(itemsToSave))

                return filtered
            })
        }
    }

    const updateMenuItem = (itemId: string, field: keyof MenuItemForm, value: any) => {
        setMenuItems(prev =>
            prev.map(item =>
                item.id === itemId
                    ? { ...item, [field]: value }
                    : item
            )
        )
    }

    // Price validation function
    const validatePrice = (value: string): boolean => {
        if (value === "") return true
        const regex = /^\d*\.?\d{0,2}$/
        return regex.test(value)
    }

    const handlePriceChange = (itemId: string, value: string) => {
        const cleaned = value.replace(/[^\d.]/g, '')
        const parts = cleaned.split('.')
        if (parts.length > 2) return
        if (parts[1]?.length > 2) return
        if (cleaned.length > 1 && cleaned[0] === '0' && cleaned[1] !== '.') {
            updateMenuItem(itemId, "price", cleaned.slice(1))
            return
        }
        updateMenuItem(itemId, "price", cleaned)
    }

    const isValidPrice = (price: string): boolean => {
        if (!price) return false
        const num = Number(price)
        return !isNaN(num) && num > 0
    }

    const handleCategorySubmit = () => {
        const data: NewCatType = {
            category_name: catName,
            slug_path: slugs
        }
        create_food_category(data, {
            onSuccess: (res) => {
                if (res.message && res.success) {
                    queryClient.invalidateQueries({ queryKey: ["get-all-by-slug", slugs.join("/")] })
                    toast.success(res.message)
                    setOpen(false)
                    setMode(null)
                    setCatName("")
                }
            },
            onError: err => {
                toast.error(err.message || "failed to create")
            }
        })
    }

    const handleMenuSubmit = async () => {
        if (creatingMenu ) {
            toast.error("Menu items are being created, please wait...")
            return;
        };
    
        if(!parentId){  
            toast.error("invalid category")
            return
        }

        // Check if any items are still uploading
        const uploadingItems = menuItems.filter(item => item.isUploading)
        if (uploadingItems.length > 0) {
            toast.error("Please wait for images to finish uploading")
            return
        }

        // Filter out empty items and validate prices
        const validItems = menuItems.filter(item =>
            item.name.trim() && isValidPrice(item.price)
        )

        if (validItems.length === 0) {
            toast.error("Please add at least one menu item with valid name and price")
            return
        }

        // Check for invalid prices
        const invalidPriceItems = menuItems.filter(item =>
            item.price && !isValidPrice(item.price)
        )

        if (invalidPriceItems.length > 0) {
            toast.error("Please enter valid prices for all items (positive numbers only)")
            return
        }

        // Check if all items with images have uploaded URLs
        const itemsWithMissingUrls = menuItems.filter(item =>
            item.imagePreview && !item.imageUrl && !item.isUploading
        )

        if (itemsWithMissingUrls.length > 0) {
            toast.error("Please wait for all images to finish uploading or remove them")
            return
        }

        // Prepare payload without IDs (backend will assign)
        const payload = validItems.map((item): CreateMenuItemType => (
            {
                name: item.name.trim(),
                description: item.description,
                price: Number(Number(item.price).toFixed(2)),
                is_available: item.is_available,
                image_url: item?.imageUrl || null,
                display_order: item.display_order
            }
        ))

        const finalPayload: CreateMenuItems = {
            category_id : parentId,
            menu_items: payload
        }

        create_menu_items(finalPayload, {
            onSuccess: async (res) => {
                if (res.message && res.success) {
                    queryClient.invalidateQueries({ queryKey: ["get-all-by-slug", slugs.join("/")] })
                    toast.success(res.message)
                    setCatName("")
                    setOpen(false)
                    setMode(null)
                    localStorage.removeItem(storageKeys.menuItems)
                    localStorage.removeItem(storageKeys.imageUrls)
                    setUploadedImageUrls(new Set())
                    setDraftCount(0)
                    resetToEmptyMenu()
                }
            },
            onError: (err) => {
                toast.error(err.message || "failed to create menu items")
            }
        })

    }

    const getTotalItems = () => menuItems.length
    const isValidItem = (item: MenuItemForm) =>
        item.name.trim() && isValidPrice(item.price) && !item.isUploading

    // Clear all draft data for current route
    const clearAllDrafts = async () => {
        await clearDraft()
        resetToEmptyMenu()
        toast.success("Draft cleared for this category")
    }

    // Get category name and menu items count
    const getCategoryDisplay = () => {
        if (categoriesLoading) {
            return <Skeleton className="h-4 w-32" />;
        }
        
        const category = categoriesData?.data?.find((cat: any) => cat.id === parentId);
        const menuItemCount = category?.menu_items?.length || 0;
        
        return (
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {category?.category_name || 'Select Category'}
                </span>
                {menuItemCount > 0 && (
                    <span className="flex h-5 items-center rounded-full bg-amber-100 px-2 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        {menuItemCount} {menuItemCount === 1 ? 'item' : 'items'}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="border-t bg-gray-50/50 px-6 py-5 dark:bg-gray-900/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <Utensils className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Manage Categories & Menu
                        </h2>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            Add new categories or menu items to your collection
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {draftCount > 0 && mode !== "menu" && (
                        <Button
                            onClick={clearAllDrafts}
                            variant="ghost"
                            size="sm"
                            className="text-xs text-gray-500 hover:text-red-500 dark:text-gray-400"
                        >
                            Clear Draft ({draftCount})
                        </Button>
                    )}
                    <Button
                        onClick={() => openDialog("category")}
                        variant="outline"
                        className="gap-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-amber-600 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-900 dark:hover:text-amber-400"
                    >
                        <FolderPlus className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Category</span>
                        <span className="sm:hidden">Category</span>
                    </Button>

                    <Button
                        onClick={() => openDialog("menu")}
                        className="gap-2 bg-linear-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 dark:from-amber-500 dark:to-orange-500"
                    >
                        <Utensils className="h-4 w-4" />
                        <span className="hidden sm:inline">Add Menu Items</span>
                        <span className="sm:hidden">Menu</span>
                        {draftCount > 0 && (
                            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-medium text-white">
                                {draftCount}
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className={`${mode === "menu" ? "sm:max-w-3xl" : "sm:max-w-md"}`}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            {mode === "category" ? (
                                <>
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                        <FolderPlus className="h-4 w-4" />
                                    </div>
                                    <span>Create New Category</span>
                                </>
                            ) : (
                                <>
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                        <Utensils className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span>Create Menu Items ({getTotalItems()}/10)</span>
                                            {draftCount > 0 && (
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                    {draftCount}
                                                </span>
                                            )}
                                            {menuItems.length > 0 && (
                                                <Button
                                                    onClick={clearAllDrafts}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 px-2 text-xs text-gray-500 hover:text-red-500 dark:text-gray-400"
                                                >
                                                    Clear All
                                                </Button>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            Adding to: {getCategoryDisplay()}
                                        </div>
                                    </div>
                                </>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    {/* CATEGORY FORM */}
                    {mode === "category" && (
                        <div className="space-y-5 pt-2">
                            <div className="space-y-2.5">
                                <Label htmlFor="category-name" className="text-sm font-medium">
                                    Category Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="category-name"
                                    placeholder="e.g., Breakfast, Lunch, Desserts"
                                    value={catName}
                                    onChange={(e) => setCatName(e.target.value)}
                                    className="border-gray-200 focus:border-amber-500 focus:ring-amber-500 dark:border-gray-800 dark:focus:border-amber-400"
                                    autoFocus
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Give your category a clear, descriptive name
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 bg-linear-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 dark:from-amber-500 dark:to-orange-500"
                                    onClick={handleCategorySubmit}
                                    disabled={!catName.trim() || isDisabled}
                                >
                                    {creating_category ? "Creating..." : "Create Category"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* MULTI MENU FORM */}
                    {mode === "menu" && (
                        <div className="space-y-5 pt-2">
                            <div className="max-h-[60vh] space-y-6 overflow-y-auto px-1">
                                {menuItems.map((item, index) => {
                                    const priceError = item.price && !isValidPrice(item.price)

                                    return (
                                        <div
                                            key={item.id}
                                            className="relative rounded-lg border border-gray-200 p-4 dark:border-gray-800"
                                        >
                                            {/* Item Header */}
                                            <div className="mb-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                        {index + 1}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Menu Item
                                                    </span>
                                                    {!isValidItem(item) && (
                                                        <span className="text-xs text-red-500">*Required</span>
                                                    )}
                                                    {priceError && (
                                                        <span className="text-xs text-red-500">Invalid price</span>
                                                    )}
                                                    {item.uploadError && (
                                                        <span className="text-xs text-red-500">Upload failed</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => duplicateMenuItem(item.id)}
                                                        disabled={menuItems.length >= 10 || item.isUploading}
                                                        title="Duplicate item"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                    {menuItems.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                                                            onClick={() => removeMenuItem(item.id)}
                                                            disabled={item.isUploading}
                                                            title="Remove item"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Image Upload */}
                                            <div className="mb-4 space-y-2.5">
                                                <Label className="text-sm font-medium">Item Image</Label>
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <label
                                                            htmlFor={`imageUpload-${item.id}`}
                                                            className={`relative flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-amber-500 hover:bg-amber-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-amber-400 dark:hover:bg-amber-950/20 ${item.isUploading ? 'opacity-50 cursor-not-allowed' : ''
                                                                }`}
                                                        >
                                                            {item.isUploading ? (
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <Loader2 className="h-6 w-6 animate-spin text-amber-600 dark:text-amber-400" />
                                                                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                                                        Uploading...
                                                                    </span>
                                                                </div>
                                                            ) : item.imagePreview ? (
                                                                <>
                                                                    <img
                                                                        src={item.imagePreview}
                                                                        alt="preview"
                                                                        className="h-full w-full rounded-lg object-cover"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.preventDefault()
                                                                            clearImage(item.id)
                                                                        }}
                                                                        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600"
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <Upload className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                                                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                                                        Upload
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </label>

                                                        <input
                                                            id={`imageUpload-${item.id}`}
                                                            type="file"
                                                            accept="image/*"
                                                            hidden
                                                            disabled={item.isUploading}
                                                            onChange={(e) => handleImageChange(e, item.id)}
                                                        />
                                                    </div>
                                                    <div className="flex-1 text-[10px] text-gray-500 dark:text-gray-400">
                                                        {item.imageUrl ? (
                                                            <p className="text-green-600 dark:text-green-400">
                                                                ✓ Image uploaded successfully
                                                            </p>
                                                        ) : item.uploadError ? (
                                                            <p className="text-red-500">
                                                                Upload failed. Click to try again.
                                                            </p>
                                                        ) : (
                                                            <>
                                                                <p>PNG, JPG up to 5MB</p>
                                                                <p>Auto-upload on selection</p>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Form Fields */}
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-medium">
                                                        Name <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        placeholder="Item name"
                                                        value={item.name}
                                                        onChange={(e) =>
                                                            updateMenuItem(item.id, "name", e.target.value)
                                                        }
                                                        className="h-9 border-gray-200 text-sm focus:border-amber-500 focus:ring-amber-500 dark:border-gray-800"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-xs font-medium">
                                                        Price <span className="text-red-500">*</span>
                                                    </Label>
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                                                            Rs
                                                        </span>
                                                        <Input
                                                            type="text"
                                                            inputMode="decimal"
                                                            placeholder="0.00"
                                                            value={item.price}
                                                            onChange={(e) =>
                                                                handlePriceChange(item.id, e.target.value)
                                                            }
                                                            className={`h-9 border-gray-200 pl-7 text-sm focus:border-amber-500 focus:ring-amber-500 dark:border-gray-800 ${priceError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                                                                }`}
                                                        />
                                                    </div>
                                                    {priceError && (
                                                        <p className="text-xs text-red-500">
                                                            Please enter a valid price (e.g., 10.99)
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="sm:col-span-2">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-medium">
                                                            Description
                                                        </Label>
                                                        <Textarea
                                                            placeholder="Describe your menu item..."
                                                            value={item.description}
                                                            onChange={(e) =>
                                                                updateMenuItem(item.id, "description", e.target.value)
                                                            }
                                                            className="min-h-16 resize-none border-gray-200 text-sm focus:border-amber-500 focus:ring-amber-500 dark:border-gray-800"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-xs font-medium">
                                                        Display Order
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={item.display_order}
                                                        onChange={(e) =>
                                                            updateMenuItem(item.id, "display_order", Number(e.target.value))
                                                        }
                                                        className="h-9 border-gray-200 text-sm focus:border-amber-500 focus:ring-amber-500 dark:border-gray-800"
                                                        min="0"
                                                    />
                                                </div>

                                                <div className="flex items-center space-x-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-900/50">
                                                    <Checkbox
                                                        id={`available-${item.id}`}
                                                        checked={item.is_available}
                                                        onCheckedChange={(checked) =>
                                                            updateMenuItem(item.id, "is_available", Boolean(checked))
                                                        }
                                                        className="border-gray-300 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600 dark:border-gray-600"
                                                    />
                                                    <Label htmlFor={`available-${item.id}`} className="cursor-pointer text-xs font-medium">
                                                        Available
                                                    </Label>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Add More Button */}
                            {menuItems.length < 10 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full gap-2 border-dashed"
                                    onClick={addMenuItem}
                                    disabled={menuItems.some(item => item.isUploading)}
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Another Menu Item ({getTotalItems()}/10)
                                </Button>
                            )}

                            {/* Summary and Actions */}
                            <div className="space-y-3 border-t pt-4 dark:border-gray-800">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        Ready to add:
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                        {menuItems.filter(isValidItem).length} valid item(s)
                                    </span>
                                </div>
                                {menuItems.some(item => item.isUploading) && (
                                    <p className="text-xs text-amber-600 dark:text-amber-400">
                                        ⏳ Please wait for images to finish uploading...
                                    </p>
                                )}

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                            setOpen(false)
                                        }}
                                        disabled={menuItems.some(item => item.isUploading)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="flex-1 bg-linear-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 dark:from-amber-500 dark:to-orange-500"
                                        onClick={handleMenuSubmit}
                                        disabled={!menuItems.some(isValidItem) || menuItems.some(item => item.isUploading) || creatingMenu}
                                    >
                                        {
                                            creatingMenu ? ("Creating menu...") : (
                                                <>
                                                    {menuItems.some(item => item.isUploading) ? (
                                                        <span className="flex items-center gap-2">
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            Uploading...
                                                        </span>
                                                    ) : (
                                                        `Add ${menuItems.filter(isValidItem).length} Item(s)`
                                                    )}
                                                </>
                                            )
                                        }
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}