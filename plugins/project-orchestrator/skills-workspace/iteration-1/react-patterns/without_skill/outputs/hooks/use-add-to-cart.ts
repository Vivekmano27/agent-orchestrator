"use client";

import { useCallback, useState, useTransition } from "react";
import { Product } from "../types/product";
import { useCartStore } from "../stores/cart-store";

interface UseAddToCartReturn {
  addToCart: (product: Product) => void;
  isPending: boolean;
  isSuccess: boolean;
}

export function useAddToCart(): UseAddToCartReturn {
  const addItem = useCartStore((state) => state.addItem);
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);

  const addToCart = useCallback(
    (product: Product) => {
      // Optimistic update: add to store immediately
      startTransition(() => {
        addItem(product);
        setIsSuccess(true);

        // Reset success state after brief feedback period
        setTimeout(() => setIsSuccess(false), 1500);
      });
    },
    [addItem]
  );

  return { addToCart, isPending, isSuccess };
}
