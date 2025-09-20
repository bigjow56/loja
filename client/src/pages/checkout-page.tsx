import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const checkoutSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(9, "Telefone deve ter pelo menos 9 dígitos"),
  endereco: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  cidade: z.string().min(2, "Cidade deve ter pelo menos 2 caracteres"),
  codigoPostal: z.string().min(4, "Código postal inválido"),
  pais: z.string().min(2, "País deve ter pelo menos 2 caracteres"),
  numeroCartao: z.string().regex(/^\d{16}$/, "Número do cartão deve ter 16 dígitos"),
  dataExpiracao: z.string().regex(/^\d{2}\/\d{2}$/, "Data de expiração deve estar no formato MM/AA"),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV deve ter 3 ou 4 dígitos"),
  nomeCartao: z.string().min(2, "Nome no cartão deve ter pelo menos 2 caracteres"),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { items, total, itemCount } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [orderId, setOrderId] = useState<string>("");

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      nome: user?.nome || "",
      email: user?.email || "",
      telefone: "",
      endereco: "",
      cidade: "",
      codigoPostal: "",
      pais: "Portugal",
      numeroCartao: "",
      dataExpiracao: "",
      cvv: "",
      nomeCartao: "",
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/checkout", {});
      return await response.json();
    },
    onSuccess: (data) => {
      setOrderId(data.order.id);
      setOrderCompleted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Pedido realizado com sucesso!",
        description: "Seu pedido foi processado e você receberá uma confirmação por email.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao processar pedido",
        description: error.message || "Ocorreu um erro ao processar seu pedido. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-4">Faça login para finalizar a compra</h1>
            <p className="text-muted-foreground mb-6">
              Você precisa estar logado para finalizar sua compra.
            </p>
            <Button onClick={() => setLocation("/auth")} data-testid="login-to-checkout">
              Fazer login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (items.length === 0 && !orderCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-4">Carrinho vazio</h1>
            <p className="text-muted-foreground mb-6">
              Adicione alguns produtos ao carrinho antes de finalizar a compra.
            </p>
            <Button onClick={() => setLocation("/")} data-testid="back-to-shopping">
              Voltar às compras
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (orderCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-4">Pedido confirmado!</h1>
            <p className="text-muted-foreground mb-4">
              Seu pedido #{orderId.slice(-8)} foi processado com sucesso.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Você receberá um email de confirmação em breve com os detalhes do pedido e informações de rastreamento.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={() => setLocation("/")} 
                className="w-full"
                data-testid="continue-shopping-success"
              >
                Continuar comprando
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setLocation("/orders")}
                className="w-full"
                data-testid="view-orders"
              >
                Ver meus pedidos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const shippingCost = total >= 50 ? 0 : 4.99;
  const finalTotal = total + shippingCost;

  const onSubmit = (data: CheckoutFormData) => {
    // Simulate payment validation
    if (data.numeroCartao === "4111111111111111") {
      checkoutMutation.mutate();
    } else {
      toast({
        title: "Erro no pagamento",
        description: "Dados do cartão inválidos. Use 4111111111111111 para teste.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8" data-testid="checkout-title">
          Finalizar Compra
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Shipping Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informações de Entrega</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu nome completo" {...field} data-testid="checkout-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="seu@email.com" {...field} data-testid="checkout-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="+351 123 456 789" {...field} data-testid="checkout-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endereco"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço</FormLabel>
                          <FormControl>
                            <Input placeholder="Rua, número, andar" {...field} data-testid="checkout-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="cidade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade</FormLabel>
                            <FormControl>
                              <Input placeholder="Lisboa" {...field} data-testid="checkout-city" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="codigoPostal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código Postal</FormLabel>
                            <FormControl>
                              <Input placeholder="1000-001" {...field} data-testid="checkout-postal-code" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="pais"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>País</FormLabel>
                            <FormControl>
                              <Input placeholder="Portugal" {...field} data-testid="checkout-country" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="w-5 h-5" />
                      <span>Informações de Pagamento</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Para teste:</strong> Use o cartão 4111111111111111, qualquer data futura e CVV 123
                      </p>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="numeroCartao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número do cartão</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="1234 5678 9012 3456" 
                              {...field}
                              maxLength={16}
                              data-testid="checkout-card-number"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dataExpiracao"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de expiração</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="MM/AA" 
                                {...field}
                                maxLength={5}
                                data-testid="checkout-expiry-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cvv"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CVV</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="123" 
                                {...field}
                                maxLength={4}
                                data-testid="checkout-cvv"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="nomeCartao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome no cartão</FormLabel>
                          <FormControl>
                            <Input placeholder="Como aparece no cartão" {...field} data-testid="checkout-cardholder-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg"
                  disabled={checkoutMutation.isPending}
                  data-testid="place-order"
                >
                  {checkoutMutation.isPending ? "Processando..." : `Finalizar Pedido - €${finalTotal.toFixed(2)}`}
                </Button>
              </form>
            </Form>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div className="flex-1">
                        <span className="font-medium">{item.product.nome}</span>
                        <span className="text-muted-foreground ml-2">x{item.quantidade}</span>
                      </div>
                      <span data-testid={`checkout-item-total-${item.id}`}>
                        €{(parseFloat(item.product.preco) * item.quantidade).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'itens'})</span>
                    <span data-testid="checkout-subtotal">€{total.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Entrega</span>
                    <span data-testid="checkout-shipping">
                      {shippingCost === 0 ? (
                        <Badge variant="secondary" className="text-green-600">Grátis</Badge>
                      ) : (
                        `€${shippingCost.toFixed(2)}`
                      )}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span data-testid="checkout-total">€{finalTotal.toFixed(2)}</span>
                </div>

                {shippingCost > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Adicione €{(50 - total).toFixed(2)} para entrega gratuita
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
