import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import type { Product } from "@shared/schema";
import { useLocation } from "wouter";

interface ProductCarouselProps {
  products: Product[];
  title: string;
  isLoading?: boolean;
}

export function ProductCarousel({ products, title, isLoading = false }: ProductCarouselProps) {
  const [, setLocation] = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const formatPrice = (price: string) => {
    const numericPrice = parseFloat(price);
    return numericPrice.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const formatOldPrice = (price: string | null) => {
    if (!price) return null;
    const numericPrice = parseFloat(price);
    return numericPrice.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const renderStars = (rating: string) => {
    const numericRating = parseFloat(rating);
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= numericRating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      );
    }
    return stars;
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const scrollAmount = 320; // Width of one product card + gap
    const container = scrollContainerRef.current;
    
    if (direction === "left") {
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }

    // Update scroll state after animation
    setTimeout(() => {
      updateScrollState();
    }, 300);
  };

  const updateScrollState = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  };

  const handleProductClick = (productId: string) => {
    setLocation(`/product/${productId}`);
  };

  if (isLoading) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">{title}</h2>
        <div className="relative">
          <div className="flex space-x-4 overflow-hidden">
            {[...Array(4)].map((_, index) => (
              <Card key={index} className="flex-none w-80 animate-pulse">
                <CardContent className="p-4">
                  <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                  <div className="bg-gray-200 h-4 rounded mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded w-2/3 mb-2"></div>
                  <div className="bg-gray-200 h-6 rounded w-1/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-foreground mb-6">{title}</h2>
      
      <div className="relative">
        {/* Left Navigation Arrow */}
        {canScrollLeft && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg hover:shadow-xl"
            onClick={() => scroll("left")}
            data-testid="carousel-prev"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Right Navigation Arrow */}
        {canScrollRight && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg hover:shadow-xl"
            onClick={() => scroll("right")}
            data-testid="carousel-next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        {/* Product Cards Container */}
        <div
          ref={scrollContainerRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onScroll={updateScrollState}
        >
          {products.map((product) => (
            <Card
              key={product.id}
              className="flex-none w-80 cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => handleProductClick(product.id)}
              data-testid={`card-product-${product.id}`}
            >
              <CardContent className="p-4">
                {/* Product Image */}
                <div className="relative mb-4">
                  <img
                    src={product.imageUrl}
                    alt={product.nome}
                    className="w-full h-48 object-cover rounded-lg bg-gray-100"
                    loading="lazy"
                  />
                  {product.desconto && product.desconto > 0 && (
                    <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600">
                      -{product.desconto}%
                    </Badge>
                  )}
                  {product.isFeatured && (
                    <Badge className="absolute top-2 right-2 bg-yellow-500 hover:bg-yellow-600">
                      Destaque
                    </Badge>
                  )}
                </div>

                {/* Product Details */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground line-clamp-2 text-sm leading-tight">
                    {product.nome}
                  </h3>
                  
                  <div className="flex items-center space-x-1">
                    {renderStars(product.avaliacao)}
                    <span className="text-sm text-muted-foreground ml-1">
                      ({product.totalAvaliacoes})
                    </span>
                  </div>

                  <div className="space-y-1">
                    {product.precoAnterior && (
                      <p className="text-sm text-muted-foreground line-through">
                        {formatOldPrice(product.precoAnterior)}
                      </p>
                    )}
                    <p className="text-lg font-bold text-foreground">
                      {formatPrice(product.preco)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      {product.vendas} vendidos
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {product.estoque} em estoque
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}