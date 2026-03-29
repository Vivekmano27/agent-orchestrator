import { Product, ProductFilters } from "../types/product";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export async function fetchProducts(
  filters?: Partial<ProductFilters>
): Promise<Product[]> {
  const params = new URLSearchParams();

  if (filters?.search) params.set("search", filters.search);
  if (filters?.category) params.set("category", filters.category);
  if (filters?.minPrice !== undefined)
    params.set("minPrice", String(filters.minPrice));
  if (filters?.maxPrice !== undefined)
    params.set("maxPrice", String(filters.maxPrice));
  if (filters?.inStockOnly) params.set("inStockOnly", "true");

  const query = params.toString();
  const url = `${API_BASE}/products${query ? `?${query}` : ""}`;

  const res = await fetch(url, { next: { revalidate: 60 } });

  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function fetchProductById(id: string): Promise<Product> {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch product ${id}: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function fetchCategories(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/categories`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }

  return res.json();
}
