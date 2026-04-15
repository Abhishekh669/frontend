"use client"
import { useState, useEffect, useRef } from 'react';
import { RestaurantSettings, UpdateRestaurantSettings } from '@/utils/types/setting.types';
import { User } from '@/utils/types/user.types';
import { getErrorMessage } from '@/utils/helper/get-error-message';
import { toast } from 'sonner';
import { updateRestaurantInformation } from '@/utils/actions/setting/setting.put';
import { useQueryClient } from '@tanstack/react-query';
import { useUploadThing } from '@/utils/uploadthing/uploadthing-client';
import { removeMultipleImages } from '@/utils/actions/uploadthing/delete-images';
import { Camera, Store, X, Loader2, RotateCcw, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  info: RestaurantSettings | undefined;
  isLoading: boolean;
  isError: boolean;
  user: User;
}

function SettingRestaurantInfoPage({ info, isLoading, isError, user }: Props) {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [originalLogoUrl, setOriginalLogoUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { startUpload } = useUploadThing('imageUploader');
  const queryClient = useQueryClient();

  const [form, setForm] = useState<UpdateRestaurantSettings>({
    id: '', name: '', slogan: '', logo_url: '',
    phone: '', email: '', address: '', country: '', state: '', city: '',
  });

  useEffect(() => {
    if (info) {
      setForm({ ...info });
      setImagePreview(info.logo_url ?? '');
      setOriginalLogoUrl(info.logo_url ?? '');
    }
  }, [info]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setImagePreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (originalLogoUrl && !selectedImageFile) {
      await removeMultipleImages([originalLogoUrl]);
      setOriginalLogoUrl('');
    }
    setImagePreview('');
    setSelectedImageFile(null);
    setForm(prev => ({ ...prev, logo_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    setLoading(true);
    let uploadedImageUrl: string | null = null;
    try {
      const payload: UpdateRestaurantSettings = { ...form };
      if (selectedImageFile) {
        if (originalLogoUrl) await removeMultipleImages([originalLogoUrl]);
        const uploadResults = await startUpload([selectedImageFile]);
        if (uploadResults) {
          uploadedImageUrl = uploadResults[0].ufsUrl;
          payload.logo_url = uploadedImageUrl;
        } else {
          throw new Error('Failed to upload image');
        }
      }
      const res = await updateRestaurantInformation(payload);
      if (!res.success) {
        toast.error(res.error || 'Failed to update restaurant information');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['get-restaurant-information'] });
      setSelectedImageFile(null);
      setOriginalLogoUrl(payload.logo_url ?? '');
      toast.success(res.message);
    } catch (error) {
      if (uploadedImageUrl) await removeMultipleImages([uploadedImageUrl]);
      toast.error(getErrorMessage(error) as string || 'Failed to update restaurant information');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (info) {
      setForm({ ...info });
      setImagePreview(info.logo_url ?? '');
      setSelectedImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 p-4 rounded-xl border border-border">
          <Skeleton className="w-20 h-20 rounded-2xl shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // ─── Error state ────────────────────────────────────────────────────────────
  if (isError) return (
    <Alert variant="destructive">
      <AlertDescription>
        Failed to load restaurant information. Please refresh the page.
      </AlertDescription>
    </Alert>
  );

  // ─── Main form ──────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                <Store className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Restaurant information</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Public-facing details for your restaurant
                </CardDescription>
              </div>
            </div>
            {selectedImageFile && (
              <Badge variant="secondary" className="text-xs">
                Unsaved changes
              </Badge>
            )}
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6 space-y-6">

          {/* ── Image section ── */}
          <div className="flex items-center gap-5 p-4 rounded-xl bg-muted/40 border border-border">
            {/* Clickable image area */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  onClick={() => !loading && fileInputRef.current?.click()}
                  className={cn(
                    "relative w-44 h-28 rounded-2xl border-2 border-dashed border-border bg-background",
                    "flex items-center justify-center cursor-pointer shrink-0 overflow-hidden",
                    "hover:border-foreground/40 hover:bg-muted transition-all duration-200 group",
                    loading && "pointer-events-none opacity-60"
                  )}
                >
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Restaurant image"
                        className="w-full h-full object-contain p-1"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                        <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
                      <Camera className="w-5 h-5" />
                      <span className="text-[10px] font-medium">Image</span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    disabled={loading}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">{imagePreview ? 'Click to change image' : 'Click to upload image'}</p>
              </TooltipContent>
            </Tooltip>

            {/* Image info + actions */}
            <div className="flex flex-col gap-1.5 min-w-0">
              <p className="text-xs font-medium text-foreground">Restaurant image</p>
              <p className="text-[11px] text-muted-foreground">
                Optional · PNG, JPG, WEBP · Max 2MB
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => fileInputRef.current?.click()}
                  className="h-7 text-xs px-3 rounded-lg"
                >
                  <Camera className="w-3 h-3 mr-1.5" />
                  {imagePreview ? 'Change' : 'Upload'}
                </Button>
                {imagePreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={loading}
                    onClick={handleRemoveImage}
                    className="h-7 text-xs px-3 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="w-3 h-3 mr-1.5" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* ── Identity fields ── */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Basic info
            </p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { label: 'Restaurant name', name: 'name', required: true, placeholder: 'e.g. The Golden Fork' },
                { label: 'Slogan', name: 'slogan', placeholder: 'A tagline for your restaurant' },
                { label: 'Phone', name: 'phone', placeholder: '+1 (555) 000-0000' },
                { label: 'Email', name: 'email', type: 'email', placeholder: 'contact@restaurant.com' },
              ] as const).map(({ label, name, required, type, placeholder }: any) => (
                <div key={name} className="space-y-1.5">
                  <Label htmlFor={name} className="text-xs text-muted-foreground">
                    {label}
                    {required && <span className="text-destructive ml-0.5">*</span>}
                  </Label>
                  <Input
                    id={name}
                    type={type ?? 'text'}
                    name={name}
                    value={(form as any)[name] ?? ''}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder={placeholder}
                    className="h-9 text-sm rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* ── Location fields ── */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Location
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs text-muted-foreground">Address</Label>
              <Input
                id="address"
                name="address"
                value={form.address ?? ''}
                onChange={handleChange}
                disabled={loading}
                placeholder="123 Main Street, Suite 4"
                className="h-9 text-sm rounded-lg"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(['country', 'state', 'city'] as const).map(name => (
                <div key={name} className="space-y-1.5">
                  <Label htmlFor={name} className="text-xs text-muted-foreground capitalize">
                    {name}
                  </Label>
                  <Input
                    id={name}
                    name={name}
                    value={(form as any)[name] ?? ''}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder={name.charAt(0).toUpperCase() + name.slice(1)}
                    className="h-9 text-sm rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* ── Footer actions ── */}
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              Last updated:{' '}
              {info?.updated_at
                ? new Date(info.updated_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                  })
                : '—'
              }
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={loading}
                className="h-9 text-sm rounded-lg"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Reset
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSubmit}
                disabled={loading}
                className="h-9 text-sm rounded-lg min-w-[130px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Save changes
                  </>
                )}
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

export default SettingRestaurantInfoPage;