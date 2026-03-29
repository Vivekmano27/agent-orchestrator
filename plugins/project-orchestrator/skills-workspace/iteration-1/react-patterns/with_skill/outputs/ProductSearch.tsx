// components/ProductSearch.tsx — Client Component (needs 'use client')
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useProductFilterStore } from './product-filter-context';

function useDebouncedValue<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

interface ProductSearchProps {
  categories: string[];
}

export function ProductSearch({ categories }: ProductSearchProps) {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  const { category, setSearch, setCategory } = useProductFilterStore();

  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setCategory(e.target.value || undefined);
    },
    [setCategory]
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchInput(e.target.value);
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setSearchInput('');
    setSearch('');
    setCategory(undefined);
  }, [setSearch, setCategory]);

  return (
    <div role="search" aria-label="Filter products">
      <div>
        <label htmlFor="product-search">Search products</label>
        <input
          id="product-search"
          type="search"
          placeholder="Search by name or description..."
          value={searchInput}
          onChange={handleSearchChange}
          aria-label="Search products by name or description"
        />
      </div>

      <div>
        <label htmlFor="category-filter">Category</label>
        <select
          id="category-filter"
          value={category ?? ''}
          onChange={handleCategoryChange}
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {(searchInput || category) && (
        <button
          onClick={handleClearFilters}
          aria-label="Clear all filters"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

// Zustand store for filter state shared between ProductSearch and ProductGrid
import { create } from 'zustand';

interface ProductFilterState {
  search: string;
  category?: string;
  setSearch: (search: string) => void;
  setCategory: (category?: string) => void;
}

export const useProductFilterStore = create<ProductFilterState>((set) => ({
  search: '',
  category: undefined,
  setSearch: (search) => set({ search }),
  setCategory: (category) => set({ category }),
}));
