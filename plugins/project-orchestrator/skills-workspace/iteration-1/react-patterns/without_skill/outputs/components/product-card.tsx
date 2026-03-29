"use client";

import Image from "next/image";
import { Product } from "../types/product";
import { AddToCartButton } from "./add-to-cart-button";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform group-hover:scale-105"
        />
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-900">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {product.category}
        </span>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-xs text-gray-600 line-clamp-2">
          {product.description}
        </p>

        <div className="mt-auto pt-2">
          <p className="mb-2 text-lg font-bold text-gray-900">
            ${product.price.toFixed(2)}
          </p>
          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
}
