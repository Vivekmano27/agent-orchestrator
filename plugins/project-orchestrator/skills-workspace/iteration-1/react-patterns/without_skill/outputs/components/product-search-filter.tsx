"use client";

import { useCallback, useState } from "react";
import { useDebounce } from "../hooks/use-debounce";
import { useCategories } from "../hooks/use-products";
import { ProductFilters } from "../types/product";

interface ProductSearchFilterProps {
  onFiltersChange: (filters: Partial<ProductFilters>) => void;
}

export function ProductSearchFilter({
  onFiltersChange,
}: ProductSearchFilterProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);

  const { data: categories = [] } = useCategories();

  const debouncedSearch = useDebounce(search, 300);

  // Notify parent whenever debounced search or other filters change
  const notifyChange = useCallback(
    (overrides: Partial<ProductFilters> = {}) => {
      onFiltersChange({
        search: debouncedSearch,
        category,
        inStockOnly,
        ...overrides,
      });
    },
    [debouncedSearch, category, inStockOnly, onFiltersChange]
  );

  // Trigger filter change when debounced search updates
  // Using a ref-based approach to avoid stale closures
  const previousDebouncedRef = useState({ value: debouncedSearch })[0];
  if (previousDebouncedRef.value !== debouncedSearch) {
    previousDebouncedRef.value = debouncedSearch;
    onFiltersChange({ search: debouncedSearch, category, inStockOnly });
  }

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    notifyChange({ category: newCategory });
  };

  const handleStockToggle = (checked: boolean) => {
    setInStockOnly(checked);
    notifyChange({ inStockOnly: checked });
  };

  const handleClearFilters = () => {
    setSearch("");
    setCategory("");
    setInStockOnly(false);
    onFiltersChange({ search: "", category: "", inStockOnly: false });
  };

  const hasActiveFilters = search || category || inStockOnly;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {/* Search Input */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Search products"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* Category Filter */}
        <select
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* In Stock Toggle */}
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => handleStockToggle(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          In stock only
        </label>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="ml-auto text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
