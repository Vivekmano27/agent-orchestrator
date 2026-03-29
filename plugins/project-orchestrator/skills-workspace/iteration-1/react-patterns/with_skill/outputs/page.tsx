// app/products/page.tsx — Server Component (default, no directive needed)
// Can: fetch data directly, access DB, read files, use async/await
// Cannot: use hooks, event handlers, browser APIs

import { ProductSearch } from '@/components/ProductSearch';
import { ProductGrid } from '@/components/ProductGrid';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  inStock: boolean;
}

async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${process.env.API_URL}/api/products`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json();
}

async function getCategories(): Promise<string[]> {
  const response = await fetch(`${process.env.API_URL}/api/categories`, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return [];
  }

  return response.json();
}

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return (
    <main>
      <h1>Product Catalog</h1>
      <ProductSearch categories={categories} />
      <ProductGrid initialProducts={products} />
    </main>
  );
}
