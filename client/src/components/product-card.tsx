import { Link } from "wouter";
import { Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/cart-context";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, isAddingToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id);
  };

  return (
    <Link href={`/product/${product.id}`}>
      <Card className="group overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-lg" data-testid={`product-card-${product.id}`}>
        <div className="relative overflow-hidden">
          <img 
            src={product.imageUrl} 
            alt={product.nome}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            data-testid={`product-image-${product.id}`}
          />
          <div className="absolute top-3 right-3">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/90 hover:bg-white p-2 rounded-full shadow-sm transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // TODO: Implement wishlist functionality
              }}
              data-testid={`wishlist-button-${product.id}`}
            >
              <Heart className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
          {product.estoque < 10 && product.estoque > 0 && (
            <div className="absolute top-3 left-3">
              <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-medium">
                Poucos em estoque
              </span>
            </div>
          )}
          {product.estoque === 0 && (
            <div className="absolute top-3 left-3">
              <span className="bg-destructive text-destructive-foreground px-2 py-1 rounded text-xs font-medium">
                Esgotado
              </span>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 
            className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors"
            data-testid={`product-name-${product.id}`}
          >
            {product.nome}
          </h3>
          <p 
            className="text-sm text-muted-foreground mb-3 line-clamp-2"
            data-testid={`product-description-${product.id}`}
          >
            {product.descricao}
          </p>
          <div className="flex items-center justify-between">
            <span 
              className="text-lg font-bold text-foreground"
              data-testid={`product-price-${product.id}`}
            >
              €{parseFloat(product.preco).toFixed(2)}
            </span>
            <Button
              onClick={handleAddToCart}
              disabled={product.estoque === 0 || isAddingToCart}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              data-testid={`add-to-cart-${product.id}`}
            >
              {product.estoque === 0 ? "Esgotado" : "Adicionar"}
            </Button>
          </div>
          <div className="flex items-center mt-2">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-current" />
              ))}
            </div>
            <span className="text-xs text-muted-foreground ml-2">(47 avaliações)</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
