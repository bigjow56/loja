import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Heart, Star, Minus, Plus } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { useState } from "react";
import type { Product } from "@shared/schema";

export default function ProductDetailPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { addToCart, isAddingToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ["/api/products", params.id],
  });

  const handleAddToCart = () => {
    if (product) {
      addToCart(product.id, quantity);
    }
  };

  const increaseQuantity = () => {
    if (product && quantity < product.estoque) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full rounded-xl" />
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Produto não encontrado</h1>
            <p className="text-muted-foreground mb-6">
              O produto que você está procurando não existe ou foi removido.
            </p>
            <Button onClick={() => setLocation("/")} data-testid="back-to-home">
              Voltar à página inicial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-8"
          data-testid="back-button"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar aos produtos
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="relative">
            <img
              src={product.imageUrl}
              alt={product.nome}
              className="w-full h-96 object-cover rounded-xl"
              data-testid="product-detail-image"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-full shadow-sm"
              data-testid="wishlist-button"
            >
              <Heart className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 
                className="text-3xl font-bold text-foreground mb-4"
                data-testid="product-detail-name"
              >
                {product.nome}
              </h1>
              
              {/* Stock Status */}
              <div className="flex items-center space-x-2 mb-4">
                {product.estoque > 0 ? (
                  <>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Em estoque
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {product.estoque} unidades disponíveis
                    </span>
                  </>
                ) : (
                  <Badge variant="destructive">
                    Esgotado
                  </Badge>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">(47 avaliações)</span>
              </div>
            </div>

            <p 
              className="text-lg text-muted-foreground leading-relaxed"
              data-testid="product-detail-description"
            >
              {product.descricao}
            </p>

            {/* Price */}
            <div className="border-t border-border pt-6">
              <span 
                className="text-3xl font-bold text-foreground"
                data-testid="product-detail-price"
              >
                €{parseFloat(product.preco).toFixed(2)}
              </span>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-foreground">Quantidade:</span>
                <div className="flex items-center border border-border rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                    className="h-10 w-10 p-0"
                    data-testid="decrease-quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span 
                    className="px-4 py-2 text-center min-w-[60px]"
                    data-testid="quantity-display"
                  >
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={increaseQuantity}
                    disabled={quantity >= product.estoque}
                    className="h-10 w-10 p-0"
                    data-testid="increase-quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <Button
                onClick={handleAddToCart}
                disabled={product.estoque === 0 || isAddingToCart}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg"
                data-testid="add-to-cart-detail"
              >
                {product.estoque === 0 
                  ? "Produto esgotado" 
                  : isAddingToCart 
                    ? "Adicionando..."
                    : `Adicionar ao carrinho - €${(parseFloat(product.preco) * quantity).toFixed(2)}`
                }
              </Button>
            </div>

            {/* Product Features */}
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Características</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Garantia de 1 ano</li>
                <li>• Entrega gratuita acima de €50</li>
                <li>• Devolução em 30 dias</li>
                <li>• Suporte técnico 24/7</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 border-t border-border pt-16">
          <h2 className="text-2xl font-bold text-foreground mb-8">Avaliações dos clientes</h2>
          <div className="space-y-6">
            {/* Sample Review */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground font-medium">M</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-foreground">Maria Silva</span>
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Excelente produto! A qualidade superou minhas expectativas. 
                      Recomendo para quem busca qualidade e durabilidade.
                    </p>
                    <span className="text-xs text-muted-foreground">Há 2 dias</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
