import { useQuery } from "@tanstack/react-query";
import { fetchProducts, fetchCategories } from "../lib/api";
import { ProductFilters } from "../types/product";

export function useProducts(filters?: Partial<ProductFilters>) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => fetchProducts(filters),
    staleTime: 1000 * 60,
    placeholderData: (previousData) => previousData,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 5,
  });
}
