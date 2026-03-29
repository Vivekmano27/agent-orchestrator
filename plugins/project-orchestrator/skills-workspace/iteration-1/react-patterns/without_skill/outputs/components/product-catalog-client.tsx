"use client";

import { useCallback, useState } from "react";
import { ProductFilters } from "../types/product";
import { ProductSearchFilter } from "./product-search-filter";
import { ProductGrid } from "./product-grid";

export function ProductCatalogClient() {
  const [filters, setFilters] = useState<Partial<ProductFilters>>({});

  const handleFiltersChange = useCallback(
    (newFilters: Partial<ProductFilters>) => {
      setFilters(newFilters);
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <ProductSearchFilter onFiltersChange={handleFiltersChange} />
      <ProductGrid filters={filters} onClearFilters={handleClearFilters} />
    </div>
  );
}
