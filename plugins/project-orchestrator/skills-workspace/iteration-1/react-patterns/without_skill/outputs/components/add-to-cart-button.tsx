"use client";

import { Product } from "../types/product";
import { useAddToCart } from "../hooks/use-add-to-cart";

interface AddToCartButtonProps {
  product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart, isPending, isSuccess } = useAddToCart();

  const isDisabled = !product.inStock || isPending;

  const buttonText = (() => {
    if (!product.inStock) return "Out of Stock";
    if (isSuccess) return "Added!";
    if (isPending) return "Adding...";
    return "Add to Cart";
  })();

  return (
    <button
      onClick={() => addToCart(product)}
      disabled={isDisabled}
      className={`w-full rounded-md px-4 py-2 text-sm font-medium transition-colors ${
        !product.inStock
          ? "cursor-not-allowed bg-gray-100 text-gray-400"
          : isSuccess
            ? "bg-green-600 text-white"
            : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
      }`}
      aria-label={`Add ${product.name} to cart`}
    >
      {buttonText}
    </button>
  );
}
