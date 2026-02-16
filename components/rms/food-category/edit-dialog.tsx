'use client'

import { memo, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import Image from 'next/image'
import { X,  } from 'lucide-react'
import { Category, MenuItem, UpdateCategoryType, UpdateMenuItemType } from '@/utils/types/food-category.types'
import { toast } from 'sonner'

interface EditCategoryDialogProps {
    category: Category | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (data: UpdateCategoryType) => Promise<void>,
    isSaving : boolean
}

interface EditMenuItemDialogProps {
    item: MenuItem | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (data: UpdateMenuItemType, imageFile?: File) => Promise<void>
    isSaving : boolean
}


export const EditCategoryDialog = memo(function EditCategoryDialog({
    category,
    open,
    onOpenChange,
    onSave,
    isSaving
}: EditCategoryDialogProps) {
    const [formData, setFormData] = useState<UpdateCategoryType>({
        id: '',
        name: '',
        is_active: true,
        display_order: 0
    });

    useEffect(() => {
        if (category) {
            setFormData({
                id: category.id,
                name: category.name,
                is_active: category.is_active,
                display_order: category.display_order
            });
        }
    }, [category]);

    const handleSubmit = async (e: React.FormEvent) => {
        if(isSaving)return;
        e.preventDefault();
        try {
            await onSave(formData);
        } catch (error) {
            // Error is already handled in onSave, just log it
            console.error('Failed to save category:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to save category');
        } 
    };

    // Prevent dialog from closing while saving
    const handleOpenChange = (newOpen: boolean) => {
        if (isSaving) {
            return; // Don't allow closing while saving
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-106" onInteractOutside={(e) => {
                if (isSaving) {
                    e.preventDefault(); // Prevent closing by clicking outside while saving
                }
            }}>
                <DialogHeader>
                    <DialogTitle>Edit Category</DialogTitle>
                    <DialogDescription>
                        Make changes to the category here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="col-span-3"
                                required
                                disabled={isSaving}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="display_order" className="text-right">
                                Display Order
                            </Label>
                            <Input
                                id="display_order"
                                type="number"
                                value={formData.display_order}
                                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                                className="col-span-3"
                                disabled={isSaving}
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="is_active" className="text-right">
                                Active
                            </Label>
                            <div className="col-span-3 flex items-center space-x-2">
                                <Checkbox
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, is_active: checked as boolean })
                                    }
                                    disabled={isSaving}
                                />
                                <Label htmlFor="is_active">Category is active</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
});

export const EditMenuItemDialog = memo(function EditMenuItemDialog({
    item,
    open,
    onOpenChange,
    onSave,
    isSaving
}: EditMenuItemDialogProps) {
    const [formData, setFormData] = useState<UpdateMenuItemType>({
        id: '',
        name: '',
        description: '',
        price: 0,
        is_available: true,
        image_url: '',
        display_order: 0
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (item) {
            setFormData({
                id: item.id,
                name: item.name,
                description: item.description || '',
                price: typeof item.price === 'number' ? item.price : parseFloat(item.price as any),
                is_available: item.is_available,
                image_url: item.image_url || '',
                display_order: item.display_order
            });
            setPreviewUrl(item.image_url || null);
        }
    }, [item]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        if(isSaving)return;
         e.preventDefault();
        try {
            await onSave(formData, imageFile || undefined);
            handleRemoveImage();
        } catch (error) {
            console.error('Failed to save:', error);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setPreviewUrl(null);
       
    };
    const handleOpenChange = (newOpen: boolean) => {
        if (isSaving) {
            return; // Don't allow closing while saving
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-131" onInteractOutside={(e) => {
                if (isSaving) {
                    e.preventDefault();
                }
            }}>
                <DialogHeader>
                    <DialogTitle>Edit Menu Item</DialogTitle>
                    <DialogDescription>
                        Make changes to the menu item here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <ScrollArea className="h-[60vh] pr-4">
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="item-name" className="text-right">
                                    Name
                                </Label>
                                <Input
                                    id="item-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="col-span-3"
                                    required
                                    disabled={isSaving}
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="col-span-3"
                                    rows={3}
                                    disabled={isSaving}
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="price" className="text-right">
                                    Price
                                </Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                    className="col-span-3"
                                    required
                                    disabled={isSaving}
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="display_order" className="text-right">
                                    Display Order
                                </Label>
                                <Input
                                    id="display_order"
                                    type="number"
                                    value={formData.display_order}
                                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                                    className="col-span-3"
                                    disabled={isSaving}
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="is_available" className="text-right">
                                    Available
                                </Label>
                                <div className="col-span-3 flex items-center space-x-2">
                                    <Checkbox
                                        id="is_available"
                                        checked={formData.is_available}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, is_available: checked as boolean })
                                        }
                                        disabled={isSaving}
                                    />
                                    <Label htmlFor="is_available">Item is available</Label>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="image" className="text-right">
                                    Image
                                </Label>
                                <div className="col-span-3 space-y-2">
                                    {previewUrl && (
                                        <div className="relative w-full h-32 mb-2">
                                            <Image
                                                src={previewUrl}
                                                alt="Preview"
                                                fill
                                                className="object-cover rounded"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute top-1 right-1 h-6 w-6"
                                                onClick={handleRemoveImage}
                                                disabled={isSaving}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="image"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="flex-1"
                                            disabled={isSaving}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Leave empty to keep current image. New image will replace the old one.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                    <DialogFooter className="mt-4">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => onOpenChange(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
});