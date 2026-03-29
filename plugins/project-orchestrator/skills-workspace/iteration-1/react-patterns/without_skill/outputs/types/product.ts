export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  inStock: boolean;
}

export interface ProductFilters {
  search: string;
  category: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
