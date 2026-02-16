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


export interface CreateMenuItemType {
  name : string;
  description  : string ;
  price : number;
  is_available : boolean;
  image_url  : string | null;
  display_order : number;
} 


export interface CreateMenuItems {
  category_id : string;
  menu_items : CreateMenuItemType[];
}



export interface CategoryData {
  success: boolean;
  breadcrumb: Category[];
  children: Category[];
  menu_items: MenuItem[];
}

export interface UpdateCategoryType {
  id: string;
  name: string;
  is_active: boolean;
  display_order: number;
}


export interface UpdateMenuItemType {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  is_available: boolean;
  image_url?: string | null;
  display_order: number;
}



export interface CategoryApi {
  updateCategory: (data: UpdateCategoryType) => Promise<void>;
  deleteCategories: (ids: string[]) => Promise<void>;
}

export interface MenuItemApi {
  updateMenuItem: (data: UpdateMenuItemType, imageFile?: File) => Promise<void>;
  deleteMenuItems: (ids: string[]) => Promise<void>;
  toggleAvailability: (id: string, isAvailable: boolean) => Promise<void>;
}