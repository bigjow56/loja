import { useQuery } from "@tanstack/react-query";
import { ProductCarousel } from "./ProductCarousel";
import type { Product } from "@shared/schema";

interface RecommendationsSectionProps {
  currentProductId: string;
}

export function RecommendationsSection({ currentProductId }: RecommendationsSectionProps) {
  // Query for related products
  const { data: relatedProducts, isLoading: isLoadingRelated } = useQuery<Product[]>({
    queryKey: ["/api/products", currentProductId, "related"],
    queryFn: async () => {
      const response = await fetch(`/api/products/${currentProductId}/related?limit=8`);
      if (!response.ok) {
        throw new Error("Failed to fetch related products");
      }
      return response.json();
    },
  });

  // Query for bestselling products
  const { data: bestsellingProducts, isLoading: isLoadingBestsellers } = useQuery<Product[]>({
    queryKey: ["/api/products/bestsellers"],
    queryFn: async () => {
      const response = await fetch("/api/products/bestsellers?limit=8");
      if (!response.ok) {
        throw new Error("Failed to fetch bestselling products");
      }
      return response.json();
    },
  });

  // Query for featured products
  const { data: featuredProducts, isLoading: isLoadingFeatured } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
    queryFn: async () => {
      const response = await fetch("/api/products/featured?limit=8");
      if (!response.ok) {
        throw new Error("Failed to fetch featured products");
      }
      return response.json();
    },
  });

  // Filter out the current product from recommendations to avoid showing it in its own recommendations
  const filteredRelatedProducts = relatedProducts?.filter(product => product.id !== currentProductId) || [];
  const filteredBestsellingProducts = bestsellingProducts?.filter(product => product.id !== currentProductId) || [];
  const filteredFeaturedProducts = featuredProducts?.filter(product => product.id !== currentProductId) || [];

  return (
    <div className="bg-gray-50 dark:bg-gray-900/20 py-12 mt-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Related Products Section */}
          {(filteredRelatedProducts.length > 0 || isLoadingRelated) && (
            <ProductCarousel
              products={filteredRelatedProducts}
              title="Produtos Relacionados"
              isLoading={isLoadingRelated}
            />
          )}

          {/* Bestselling Products Section */}
          {(filteredBestsellingProducts.length > 0 || isLoadingBestsellers) && (
            <ProductCarousel
              products={filteredBestsellingProducts}
              title="Mais Vendidos"
              isLoading={isLoadingBestsellers}
            />
          )}

          {/* Featured Products Section */}
          {(filteredFeaturedProducts.length > 0 || isLoadingFeatured) && (
            <ProductCarousel
              products={filteredFeaturedProducts}
              title="Produtos em Destaque"
              isLoading={isLoadingFeatured}
            />
          )}
        </div>
      </div>
    </div>
  );
}