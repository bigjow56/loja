import { createContext, useContext, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CartItemWithProduct } from "@shared/schema";

interface CartState {
  items: CartItemWithProduct[];
  isLoading: boolean;
  itemCount: number;
  total: number;
}

type CartAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ITEMS"; payload: CartItemWithProduct[] };

interface CartContextType extends CartState {
  addToCart: (productId: string, quantidade?: number) => void;
  updateQuantity: (itemId: string, quantidade: number) => void;
  removeFromCart: (itemId: string) => void;
  isAddingToCart: boolean;
}

const CartContext = createContext<CartContextType | null>(null);

function calculateCartStats(items: CartItemWithProduct[]) {
  const itemCount = items.reduce((sum, item) => sum + item.quantidade, 0);
  const total = items.reduce((sum, item) => 
    sum + (parseFloat(item.product.preco) * item.quantidade), 0
  );
  return { itemCount, total };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch cart items
  const { data: cartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ["/api/cart"],
  });

  // Calculate cart stats from query data
  const { itemCount, total } = calculateCartStats(cartItems);

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantidade = 1 }: { productId: string; quantidade?: number }) => {
      await apiRequest("POST", "/api/cart", { productId, quantidade });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item adicionado",
        description: "Produto adicionado ao carrinho com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao adicionar item ao carrinho",
        variant: "destructive",
      });
    },
  });

  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantidade }: { itemId: string; quantidade: number }) => {
      await apiRequest("PUT", `/api/cart/${itemId}`, { quantidade });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar quantidade",
        variant: "destructive",
      });
    },
  });

  // Remove from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await apiRequest("DELETE", `/api/cart/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item removido",
        description: "Produto removido do carrinho",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao remover item do carrinho",
        variant: "destructive",
      });
    },
  });

  const contextValue: CartContextType = {
    items: cartItems,
    isLoading,
    itemCount,
    total,
    addToCart: (productId: string, quantidade = 1) => {
      addToCartMutation.mutate({ productId, quantidade });
    },
    updateQuantity: (itemId: string, quantidade: number) => {
      updateQuantityMutation.mutate({ itemId, quantidade });
    },
    removeFromCart: (itemId: string) => {
      removeFromCartMutation.mutate(itemId);
    },
    isAddingToCart: addToCartMutation.isPending,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
