import { Link } from "wouter";
import { Heart, Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/cart-context";
import type { ProductWithFavorite } from "@shared/schema";

interface ProductCardProps {
  product: ProductWithFavorite;
  viewMode?: "grid" | "list";
}

export function ProductCard({ product, viewMode = "grid" }: ProductCardProps) {
  const { addToCart, isAddingToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Implement favorite functionality
  };

  const preco = parseFloat(product.preco);
  const precoAnterior = product.precoAnterior ? parseFloat(product.precoAnterior) : null;
  const desconto = product.desconto || 0;
  const avaliacao = parseFloat(product.avaliacao);
  const hasDiscount = precoAnterior && precoAnterior > preco;

  if (viewMode === "list") {
    return (
      <Link href={`/product/${product.id}`}>
        <Card className="group overflow-hidden transition-all hover:shadow-lg border-gray-200 dark:border-gray-700" data-testid={`product-card-${product.id}`}>
          <CardContent className="p-0">
            <div className="flex">
              {/* Image */}
              <div className="relative w-48 h-48 overflow-hidden flex-shrink-0">
                <img 
                  src={product.imageUrl} 
                  alt={product.nome}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  data-testid={`product-image-${product.id}`}
                />
                {/* Discount Badge */}
                {hasDiscount && desconto > 0 && (
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-red-500 text-white">
                      -{desconto}%
                    </Badge>
                  </div>
                )}
                {/* Stock Badge */}
                {product.estoque < 10 && product.estoque > 0 && (
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="outline" className="bg-white/90 text-orange-600 border-orange-600">
                      Poucos em estoque
                    </Badge>
                  </div>
                )}
                {product.estoque === 0 && (
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="outline" className="bg-white/90 text-red-600 border-red-600">
                      Esgotado
                    </Badge>
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 p-6">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {product.marca} • {product.categoria}
                    </div>
                    <h3 
                      className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                      data-testid={`product-name-${product.id}`}
                    >
                      {product.nome}
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-red-500 p-2"
                    onClick={handleToggleFavorite}
                    data-testid={`wishlist-button-${product.id}`}
                  >
                    <Heart className={`w-5 h-5 ${product.isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                </div>
                
                <p 
                  className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2"
                  data-testid={`product-description-${product.id}`}
                >
                  {product.descricao}
                </p>
                
                {/* Rating */}
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < Math.floor(avaliacao) ? 'fill-current' : 'stroke-current fill-none'}`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                    {avaliacao.toFixed(1)} ({product.totalAvaliacoes} avaliações)
                  </span>
                  {product.vendas > 0 && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-4">
                      {product.vendas} vendidos
                    </span>
                  )}
                </div>
                
                {/* Price and Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span 
                      className="text-2xl font-bold text-gray-900 dark:text-white"
                      data-testid={`product-price-${product.id}`}
                    >
                      R$ {preco.toFixed(2)}
                    </span>
                    {hasDiscount && precoAnterior && (
                      <span className="text-lg text-gray-500 dark:text-gray-400 line-through">
                        R$ {precoAnterior.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={handleAddToCart}
                    disabled={product.estoque === 0 || isAddingToCart}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                    data-testid={`add-to-cart-${product.id}`}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {product.estoque === 0 ? "Esgotado" : "Adicionar ao Carrinho"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Grid view
  return (
    <Link href={`/product/${product.id}`}>
      <Card className="group overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg border-gray-200 dark:border-gray-700" data-testid={`product-card-${product.id}`}>
        <div className="relative overflow-hidden">
          <img 
            src={product.imageUrl} 
            alt={product.nome}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            data-testid={`product-image-${product.id}`}
          />
          
          {/* Top badges */}
          <div className="absolute top-3 left-3 flex flex-col space-y-2">
            {hasDiscount && desconto > 0 && (
              <Badge className="bg-red-500 text-white">
                -{desconto}%
              </Badge>
            )}
            {product.isFeatured && (
              <Badge className="bg-blue-600 text-white">
                Destaque
              </Badge>
            )}
          </div>
          
          {/* Stock badges */}
          {product.estoque < 10 && product.estoque > 0 && (
            <div className="absolute bottom-3 left-3">
              <Badge variant="outline" className="bg-white/90 text-orange-600 border-orange-600">
                Poucos em estoque
              </Badge>
            </div>
          )}
          {product.estoque === 0 && (
            <div className="absolute bottom-3 left-3">
              <Badge variant="outline" className="bg-white/90 text-red-600 border-red-600">
                Esgotado
              </Badge>
            </div>
          )}
          
          {/* Favorite button */}
          <div className="absolute top-3 right-3">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/90 hover:bg-white p-2 rounded-full shadow-sm transition-colors"
              onClick={handleToggleFavorite}
              data-testid={`wishlist-button-${product.id}`}
            >
              <Heart className={`w-4 h-4 ${product.isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
            </Button>
          </div>
        </div>
        
        <CardContent className="p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {product.marca} • {product.categoria}
          </div>
          <h3 
            className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2"
            data-testid={`product-name-${product.id}`}
          >
            {product.nome}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center mb-3">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-3 h-3 ${i < Math.floor(avaliacao) ? 'fill-current' : 'stroke-current fill-none'}`} 
                />
              ))}
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
              {avaliacao.toFixed(1)} ({product.totalAvaliacoes})
            </span>
          </div>
          
          {/* Price */}
          <div className="flex items-center space-x-2 mb-3">
            <span 
              className="text-lg font-bold text-gray-900 dark:text-white"
              data-testid={`product-price-${product.id}`}
            >
              R$ {preco.toFixed(2)}
            </span>
            {hasDiscount && precoAnterior && (
              <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                R$ {precoAnterior.toFixed(2)}
              </span>
            )}
          </div>
          
          {/* Add to cart button */}
          <Button
            onClick={handleAddToCart}
            disabled={product.estoque === 0 || isAddingToCart}
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            data-testid={`add-to-cart-${product.id}`}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {product.estoque === 0 ? "Esgotado" : "Adicionar"}
          </Button>
          
          {product.vendas > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              {product.vendas} vendidos
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
