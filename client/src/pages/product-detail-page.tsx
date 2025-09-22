import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Heart, Star, Minus, Plus, Share2, ShoppingCart, Truck, Shield, RotateCcw } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { useState } from "react";
import type { Product } from "@shared/schema";
import { RecommendationsSection } from "@/components/RecommendationsSection";

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

  // Helper function to render rating stars
  const renderStars = (rating: number, size: string = "w-4 h-4") => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`${size} ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
          />
        ))}
      </div>
    );
  };

  // Calculate discount percentage
  const discountPercentage = product.precoAnterior 
    ? Math.round(((parseFloat(product.precoAnterior) - parseFloat(product.preco)) / parseFloat(product.precoAnterior)) * 100)
    : product.desconto || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-gray-900 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <button 
              onClick={() => setLocation("/")}
              className="hover:text-primary transition-colors"
              data-testid="link-home"
            >
              Início
            </button>
            <span>→</span>
            <button 
              onClick={() => setLocation("/products")}
              className="hover:text-primary transition-colors"
              data-testid="link-products"
            >
              Produtos
            </button>
            <span>→</span>
            <span className="text-foreground">{product.categoria}</span>
            <span>→</span>
            <span className="text-foreground font-medium truncate">{product.nome}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Product Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            
            {/* Product Gallery */}
            <div className="space-y-4">
              <div className="relative group">
                <img
                  src={product.imageUrl}
                  alt={product.nome}
                  className="w-full h-[280px] sm:h-[380px] lg:h-[500px] object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                  data-testid="product-detail-image"
                />
                {discountPercentage > 0 && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-red-500 hover:bg-red-600 text-white font-bold" data-testid="badge-discount">
                      -{discountPercentage}%
                    </Badge>
                  </div>
                )}
                <div className="absolute top-4 right-4 flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-background/80 dark:bg-gray-800/80 hover:bg-background p-2 rounded-full shadow-lg"
                    data-testid="wishlist-button"
                  >
                    <Heart className="w-4 h-4 text-muted-foreground hover:text-red-500 transition-colors" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-background/80 dark:bg-gray-800/80 hover:bg-background p-2 rounded-full shadow-lg"
                    data-testid="button-share"
                  >
                    <Share2 className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                  </Button>
                </div>
              </div>
              
              {/* Placeholder for future thumbnails */}
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={i}
                    className={`w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0 border-2 transition-all cursor-pointer ${
                      i === 0 ? 'border-primary' : 'border-transparent hover:border-gray-300'
                    }`}
                    data-testid={`thumb-${i}`}
                  >
                    <img
                      src={product.imageUrl}
                      alt={`${product.nome} ${i + 1}`}
                      className="w-full h-full object-cover rounded-lg opacity-70 hover:opacity-100 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Product Information */}
            <div className="space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="text-xs font-medium">
                    {product.marca}
                  </Badge>
                  <span className="text-sm text-muted-foreground" data-testid="text-sku">
                    SKU: {product.id.substring(0, 8).toUpperCase()}
                  </span>
                </div>
                <h1 
                  className="text-3xl font-bold text-foreground mb-4 leading-tight"
                  data-testid="product-detail-name"
                >
                  {product.nome}
                </h1>
                
                {/* Rating */}
                <div className="flex items-center space-x-3 mb-4">
                  {renderStars(parseFloat(product.avaliacao))}
                  <span className="text-sm font-medium text-foreground" data-testid="text-rating">
                    {product.avaliacao}/5
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({product.totalAvaliacoes} avaliações)
                  </span>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="text-sm text-muted-foreground" data-testid="text-sold">
                    {product.vendas} vendidos
                  </span>
                </div>

                {/* Stock Status */}
                <div className="flex items-center space-x-2 mb-6">
                  {product.estoque > 0 ? (
                    <>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" data-testid="status-stock">
                        ✓ Em estoque
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {product.estoque > 10 ? '10+' : product.estoque} unidades disponíveis
                      </span>
                    </>
                  ) : (
                    <Badge variant="destructive" data-testid="status-stock">
                      Esgotado
                    </Badge>
                  )}
                </div>
              </div>

              {/* Price Section */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <span 
                    className="text-4xl font-bold text-primary"
                    data-testid="product-detail-price"
                  >
                    R$ {parseFloat(product.preco).toFixed(2)}
                  </span>
                  {product.precoAnterior && (
                    <span className="text-xl text-muted-foreground line-through">
                      R$ {parseFloat(product.precoAnterior).toFixed(2)}
                    </span>
                  )}
                </div>
                
                {discountPercentage > 0 && (
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium" data-testid="text-savings">
                    Você economiza R$ {product.precoAnterior 
                      ? (parseFloat(product.precoAnterior) - parseFloat(product.preco)).toFixed(2)
                      : (parseFloat(product.preco) * discountPercentage / 100).toFixed(2)
                    }
                  </p>
                )}
              </div>

              {/* Quantity and Purchase */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-foreground min-w-[80px]">Quantidade:</span>
                  <div className="flex items-center border-2 border-border rounded-lg overflow-hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                      className="h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                      data-testid="decrease-quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span 
                      className="px-4 py-2 text-center min-w-[60px] font-medium"
                      data-testid="quantity-display"
                    >
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={increaseQuantity}
                      disabled={quantity >= product.estoque}
                      className="h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                      data-testid="increase-quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground" data-testid="text-total-price">
                    Total: R$ {(parseFloat(product.preco) * quantity).toFixed(2)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleAddToCart}
                    disabled={product.estoque === 0 || isAddingToCart}
                    className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                    data-testid="add-to-cart-detail"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {product.estoque === 0 
                      ? "Produto esgotado" 
                      : isAddingToCart 
                        ? "Adicionando..."
                        : "Adicionar ao carrinho"
                    }
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full h-12 font-semibold"
                    disabled={product.estoque === 0}
                    data-testid="button-buy-now"
                  >
                    Comprar agora
                  </Button>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t">
                <div className="text-center">
                  <Truck className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Entrega grátis acima de R$ 99</p>
                </div>
                <div className="text-center">
                  <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Garantia de 1 ano</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">30 dias para trocar</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg mt-8 overflow-hidden">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 bg-gray-100 dark:bg-gray-800 rounded-none">
              <TabsTrigger value="description" className="text-sm font-medium" data-testid="tab-description">
                Descrição
              </TabsTrigger>
              <TabsTrigger value="specifications" className="text-sm font-medium" data-testid="tab-specifications">
                Especificações
              </TabsTrigger>
              <TabsTrigger value="reviews" className="text-sm font-medium" data-testid="tab-reviews">
                Avaliações ({product.totalAvaliacoes})
              </TabsTrigger>
            </TabsList>
            
            <div className="p-8">
              <TabsContent value="description" className="mt-0">
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6" data-testid="product-detail-description">
                    {product.descricao}
                  </p>
                  
                  <h3 className="text-xl font-semibold text-foreground mb-4">Características principais</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      <span>Produto original da marca {product.marca}</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      <span>Garantia oficial de 1 ano</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      <span>Entrega rápida e segura</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      <span>Suporte técnico especializado</span>
                    </li>
                  </ul>
                </div>
              </TabsContent>
              
              <TabsContent value="specifications" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Informações gerais</h3>
                    <dl className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                        <dt className="text-sm text-muted-foreground">Marca</dt>
                        <dd className="text-sm font-medium text-foreground">{product.marca}</dd>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                        <dt className="text-sm text-muted-foreground">Categoria</dt>
                        <dd className="text-sm font-medium text-foreground">{product.categoria}</dd>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                        <dt className="text-sm text-muted-foreground">Garantia</dt>
                        <dd className="text-sm font-medium text-foreground">12 meses</dd>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                        <dt className="text-sm text-muted-foreground">Origem</dt>
                        <dd className="text-sm font-medium text-foreground">Nacional</dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Dimensões e peso</h3>
                    <dl className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                        <dt className="text-sm text-muted-foreground">Peso</dt>
                        <dd className="text-sm font-medium text-foreground">A definir</dd>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                        <dt className="text-sm text-muted-foreground">Dimensões</dt>
                        <dd className="text-sm font-medium text-foreground">A definir</dd>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                        <dt className="text-sm text-muted-foreground">Cor</dt>
                        <dd className="text-sm font-medium text-foreground">Variadas</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="mt-0">
                {/* Reviews Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                  <div className="lg:col-span-1">
                    <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="text-5xl font-bold text-primary mb-2">{product.avaliacao}</div>
                      <div className="flex justify-center mb-2">
                        {renderStars(parseFloat(product.avaliacao), "w-5 h-5")}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Baseado em {product.totalAvaliacoes} avaliações
                      </p>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-2">
                    <div className="space-y-3">
                      {[5, 4, 3, 2, 1].map((stars) => (
                        <div key={stars} className="flex items-center space-x-3">
                          <span className="text-sm w-8">{stars}</span>
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-yellow-400 h-2 rounded-full" 
                              style={{ width: `${stars === 5 ? 60 : stars === 4 ? 25 : stars === 3 ? 10 : stars === 2 ? 3 : 2}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground w-12">
                            {stars === 5 ? '60%' : stars === 4 ? '25%' : stars === 3 ? '10%' : stars === 2 ? '3%' : '2%'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Individual Reviews */}
                <div className="space-y-6">
                  {[
                    {
                      name: "Maria Silva",
                      rating: 5,
                      comment: "Excelente produto! A qualidade superou minhas expectativas. Recomendo para quem busca qualidade e durabilidade.",
                      date: "Há 2 dias",
                      verified: true
                    },
                    {
                      name: "João Santos",
                      rating: 4,
                      comment: "Muito bom produto, atendeu todas as minhas necessidades. Entrega foi rápida e o atendimento excelente.",
                      date: "Há 1 semana",
                      verified: true
                    },
                    {
                      name: "Ana Costa",
                      rating: 5,
                      comment: "Perfeito! Exatamente como descrito. Chegou antes do prazo e muito bem embalado.",
                      date: "Há 2 semanas",
                      verified: false
                    }
                  ].map((review, index) => (
                    <Card key={index} className="border-0 shadow-sm">
                      <CardContent className="pt-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-lg">
                              {review.name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-foreground">{review.name}</span>
                              {review.verified && (
                                <Badge variant="secondary" className="text-xs">
                                  Compra verificada
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 mb-3">
                              {renderStars(review.rating, "w-4 h-4")}
                              <span className="text-sm text-muted-foreground">{review.date}</span>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                              {review.comment}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {/* Product Recommendations Section */}
      <RecommendationsSection currentProductId={product.id} />
    </div>
  );
}
