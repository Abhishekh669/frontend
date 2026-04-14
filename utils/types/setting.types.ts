export interface RestaurantSettings {
  id: string;

  name: string;
  slogan?: string;
  logo_url?: string;

  phone?: string;
  email?: string;

  address?: string;
  country?: string;
  state?: string;
  city?: string;

  created_at: string;
  updated_at: string;
}

export interface CreateRestaurantSettings {

  name: string;
  slogan?: string;
  logo_url?: string;

  phone?: string;
  email?: string;

  address?: string;
  country?: string;
  state?: string;
  city?: string;

}

export interface UpdateRestaurantSettings {
  id: string;

  name: string;
  slogan?: string;
  logo_url?: string;

  phone?: string;
  email?: string;

  address?: string;
  country?: string;
  state?: string;
  city?: string;

}