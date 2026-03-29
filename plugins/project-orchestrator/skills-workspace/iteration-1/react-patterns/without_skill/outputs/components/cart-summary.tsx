"use client";

import { useCartStore } from "../stores/cart-store";

export function CartSummary() {
  const items = useCartStore((state) => state.items);
  const totalItems = useCartStore((state) => state.totalItems);
  const totalPrice = useCartStore((state) => state.totalPrice);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
      <div className="flex items-center gap-3">
        <svg
          className="h-5 w-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
          />
        </svg>
        <span className="text-sm font-medium text-gray-900">
          {totalItems()} {totalItems() === 1 ? "item" : "items"}
        </span>
        <span className="text-sm font-bold text-gray-900">
          ${totalPrice().toFixed(2)}
        </span>
      </div>
    </div>
  );
}
