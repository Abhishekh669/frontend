export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  level: number;
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  category_id: string;
  is_available: boolean;
  image_url?: string | null;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}
