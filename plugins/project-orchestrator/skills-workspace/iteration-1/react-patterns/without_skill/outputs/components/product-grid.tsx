"use client";

import { Product, ProductFilters } from "../types/product";
import { useProducts } from "../hooks/use-products";
import { ProductCard } from "./product-card";
import { ProductGridSkeleton } from "./product-grid-skeleton";
import { ProductGridError } from "./product-grid-error";
import { ProductGridEmpty } from "./product-grid-empty";

interface ProductGridProps {
  filters: Partial<ProductFilters>;
  onClearFilters?: () => void;
}

export function ProductGrid({ filters, onClearFilters }: ProductGridProps) {
  const { data: products, isLoading, isError, error, refetch } = useProducts(filters);

  if (isLoading) {
    return <ProductGridSkeleton />;
  }

  if (isError) {
    return (
      <ProductGridError
        message={error instanceof Error ? error.message : "Unknown error"}
        onRetry={() => refetch()}
      />
    );
  }

  if (!products || products.length === 0) {
    const hasFilters = Boolean(
      filters.search || filters.category || filters.inStockOnly
    );
    return (
      <ProductGridEmpty
        hasFilters={hasFilters}
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product: Product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
