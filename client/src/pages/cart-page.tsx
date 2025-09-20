import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/hooks/use-auth";

export default function CartPage() {
  const { items, isLoading, itemCount, total, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-4">Faça login para ver seu carrinho</h1>
            <p className="text-muted-foreground mb-6">
              Você precisa estar logado para acessar seu carrinho de compras.
            </p>
            <Link href="/auth">
              <Button data-testid="login-to-view-cart">Fazer login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-20 w-20 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-4">Seu carrinho está vazio</h1>
            <p className="text-muted-foreground mb-6">
              Parece que você ainda não adicionou nenhum item ao seu carrinho.
            </p>
            <Link href="/">
              <Button data-testid="continue-shopping">Continuar comprando</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8" data-testid="cart-title">
          Carrinho de Compras ({itemCount} {itemCount === 1 ? 'item' : 'itens'})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id} data-testid={`cart-item-${item.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.nome}
                      className="h-20 w-20 object-cover rounded-lg"
                      data-testid={`cart-item-image-${item.id}`}
                    />
                    
                    <div className="flex-1">
                      <h3 
                        className="font-semibold text-foreground mb-1"
                        data-testid={`cart-item-name-${item.id}`}
                      >
                        {item.product.nome}
                      </h3>
                      <p 
                        className="text-sm text-muted-foreground mb-2"
                        data-testid={`cart-item-description-${item.id}`}
                      >
                        {item.product.descricao}
                      </p>
                      <p 
                        className="text-lg font-bold text-foreground"
                        data-testid={`cart-item-price-${item.id}`}
                      >
                        €{parseFloat(item.product.preco).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantidade - 1)}
                        disabled={item.quantidade <= 1}
                        className="h-8 w-8 p-0"
                        data-testid={`decrease-quantity-${item.id}`}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      
                      <Input
                        type="number"
                        min="1"
                        value={item.quantidade}
                        onChange={(e) => {
                          const newQuantity = parseInt(e.target.value) || 1;
                          updateQuantity(item.id, newQuantity);
                        }}
                        className="h-8 w-16 text-center"
                        data-testid={`quantity-input-${item.id}`}
                      />
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantidade + 1)}
                        disabled={item.quantidade >= item.product.estoque}
                        className="h-8 w-8 p-0"
                        data-testid={`increase-quantity-${item.id}`}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      data-testid={`remove-item-${item.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                    <span className="text-sm text-muted-foreground">
                      Subtotal ({item.quantidade} {item.quantidade === 1 ? 'item' : 'itens'})
                    </span>
                    <span 
                      className="font-semibold text-foreground"
                      data-testid={`item-subtotal-${item.id}`}
                    >
                      €{(parseFloat(item.product.preco) * item.quantidade).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'itens'})</span>
                  <span data-testid="cart-subtotal">€{total.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Entrega</span>
                  <span className="text-green-600" data-testid="shipping-cost">
                    {total >= 50 ? "Grátis" : "€4.99"}
                  </span>
                </div>
                
                {total < 50 && (
                  <p className="text-xs text-muted-foreground">
                    Adicione €{(50 - total).toFixed(2)} para entrega gratuita
                  </p>
                )}

                <Separator />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span data-testid="cart-total">
                    €{(total + (total >= 50 ? 0 : 4.99)).toFixed(2)}
                  </span>
                </div>

                <Link href="/checkout">
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    data-testid="proceed-to-checkout"
                  >
                    Finalizar Compra
                  </Button>
                </Link>

                <Link href="/">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    data-testid="continue-shopping-cart"
                  >
                    Continuar Comprando
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
