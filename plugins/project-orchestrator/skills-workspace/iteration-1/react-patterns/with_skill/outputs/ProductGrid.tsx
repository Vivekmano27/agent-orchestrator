// components/ProductGrid.tsx — Client Component (needs 'use client')
'use client';

import { useCallback } from 'react';
import { useProducts, type Product } from '@/hooks/useProducts';
import { useCartStore } from '@/stores/cart-store';
import { useProductFilterStore } from './ProductSearch';

// --- Loading skeleton for layout stability ---

function ProductCardSkeleton() {
  return (
    <article aria-hidden="true">
      <div style={{ aspectRatio: '1', background: '#e5e7eb' }} />
      <div style={{ height: '1rem', background: '#e5e7eb', width: '75%', marginTop: '0.5rem' }} />
      <div style={{ height: '0.75rem', background: '#e5e7eb', width: '50%', marginTop: '0.25rem' }} />
      <div style={{ height: '2rem', background: '#e5e7eb', width: '100%', marginTop: '0.5rem' }} />
    </article>
  );
}

function ProductGridSkeleton() {
  return (
    <div role="status" aria-label="Loading products">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// --- Error state ---

interface ErrorMessageProps {
  error: Error;
  onRetry: () => void;
}

function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  return (
    <div role="alert">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={onRetry} aria-label="Retry loading products">
        Try again
      </button>
    </div>
  );
}

// --- Empty state ---

function EmptyState() {
  return (
    <div role="status">
      <h2>No products found</h2>
      <p>Try adjusting your search or filter criteria.</p>
    </div>
  );
}

// --- Product card with Add to Cart ---

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = useCallback(() => {
    // Optimistic: Zustand updates state synchronously, so the UI
    // reflects the new cart count immediately without waiting for
    // a server round-trip.
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
  }, [addItem, product.id, product.name, product.price, product.image]);

  return (
    <article aria-label={`Product: ${product.name}`}>
      {product.image && (
        <img
          src={product.image}
          alt={product.name}
          width={250}
          height={250}
          loading="lazy"
        />
      )}
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <p aria-label={`Price: $${product.price.toFixed(2)}`}>
        ${product.price.toFixed(2)}
      </p>
      <p>{product.category}</p>
      <button
        onClick={handleAddToCart}
        disabled={!product.inStock}
        aria-label={
          product.inStock
            ? `Add ${product.name} to cart`
            : `${product.name} is out of stock`
        }
      >
        {product.inStock ? 'Add to Cart' : 'Out of Stock'}
      </button>
    </article>
  );
}

// --- Main grid ---

interface ProductGridProps {
  initialProducts: Product[];
}

export function ProductGrid({ initialProducts }: ProductGridProps) {
  const { search, category } = useProductFilterStore();

  const filters = {
    ...(search ? { search } : {}),
    ...(category ? { category } : {}),
  };

  const hasActiveFilters = Boolean(search || category);

  const { data: products, isLoading, error, refetch } = useProducts(
    hasActiveFilters ? filters : undefined
  );

  // Use server-fetched data when no client-side filters are active
  const displayProducts = hasActiveFilters ? products : (products ?? initialProducts);

  if (isLoading && hasActiveFilters) return <ProductGridSkeleton />;
  if (error) return <ErrorMessage error={error} onRetry={() => refetch()} />;
  if (!displayProducts?.length) return <EmptyState />;

  return (
    <section aria-label="Product catalog">
      <p role="status" aria-live="polite">
        {displayProducts.length} product{displayProducts.length !== 1 ? 's' : ''} found
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1rem',
        }}
      >
        {displayProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
