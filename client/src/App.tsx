import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/contexts/cart-context";
import { ProtectedRoute } from "@/lib/protected-route";
import { ProtectedAdminRoute } from "@/lib/protected-admin-route";
import { Header } from "@/components/header";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ProductsPage from "@/pages/products-page.tsx";
import ProductDetailPage from "@/pages/product-detail-page";
import CartPage from "@/pages/cart-page";
import CheckoutPage from "@/pages/checkout-page";
import { AdminDashboard } from "@/pages/admin/dashboard";
import { AdminProductsList } from "@/pages/admin/products-list";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Switch>
        {/* Admin routes - must come first to avoid conflicts */}
        <ProtectedAdminRoute path="/admin" component={AdminDashboard} />
        <ProtectedAdminRoute path="/admin/products" component={AdminProductsList} />
        
        {/* Regular app routes with header */}
        <Route path="/" component={() => (
          <div>
            <Header />
            <HomePage />
          </div>
        )} />
        <Route path="/produtos" component={() => (
          <div>
            <Header />
            <ProductsPage />
          </div>
        )} />
        <Route path="/auth" component={() => (
          <div>
            <Header />
            <AuthPage />
          </div>
        )} />
        <Route path="/product/:id" component={() => (
          <div>
            <Header />
            <ProductDetailPage />
          </div>
        )} />
        <ProtectedRoute path="/cart" component={() => (
          <div>
            <Header />
            <CartPage />
          </div>
        )} />
        <ProtectedRoute path="/checkout" component={() => (
          <div>
            <Header />
            <CheckoutPage />
          </div>
        )} />
        
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <Toaster />
            <Router />
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
