import { Suspense } from "react";
import { fetchProducts } from "./lib/api";
import { Product } from "./types/product";
import { ProductCatalogClient } from "./components/product-catalog-client";
import { CartSummary } from "./components/cart-summary";
import { ProductGridSkeleton } from "./components/product-grid-skeleton";
import { Providers } from "./components/providers";

// Server Component: fetches initial data at the server level
// and passes it down. The client components handle interactivity.
export default async function ProductCatalogPage() {
  let initialProducts: Product[] = [];
  let fetchError: string | null = null;

  try {
    initialProducts = await fetchProducts();
  } catch (err) {
    fetchError =
      err instanceof Error ? err.message : "Failed to load products";
  }

  return (
    <Providers>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Product Catalog
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Browse our collection and find what you need.
          </p>
        </div>

        {fetchError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-6 py-12 text-center">
            <p className="text-sm font-medium text-red-800">
              Failed to load products
            </p>
            <p className="mt-1 text-sm text-red-600">{fetchError}</p>
          </div>
        ) : (
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductCatalogClient />
          </Suspense>
        )}

        <CartSummary />
      </main>
    </Providers>
  );
}
