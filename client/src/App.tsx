import { Switch, Route, useLocation } from "wouter";
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
import { AdminProductCreate } from "@/pages/admin/product-create";
import { AdminProductEdit } from "@/pages/admin/product-edit";
import { CategoriesList } from "@/pages/admin/categories-list";
import { CategoryForm } from "@/pages/admin/category-form";
import { TagsList } from "@/pages/admin/tags-list";
import { TagForm } from "@/pages/admin/tag-form";
import { StockPage } from "@/pages/admin/stock-page";
import { UsersPage } from "@/pages/admin/users-page";
import { SettingsPage } from "@/pages/admin/settings-page";
import NotFound from "@/pages/not-found";

// Wrapper components for edit modes
function CategoryEditWrapper() {
  const [location] = useLocation();
  const id = location.split('/').pop(); // Extract ID from URL
  return <CategoryForm mode="edit" id={id} />;
}

function TagEditWrapper() {
  const [location] = useLocation();
  const pathSegments = location.split('/');
  const id = pathSegments[pathSegments.length - 2]; // Get ID before 'edit'
  return <TagForm mode="edit" id={id} />;
}

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Switch>
        {/* Admin routes - must come first to avoid conflicts */}
        <ProtectedAdminRoute path="/admin" component={AdminDashboard} />
        <ProtectedAdminRoute path="/admin/products" component={AdminProductsList} />
        <ProtectedAdminRoute path="/admin/products/new" component={AdminProductCreate} />
        <ProtectedAdminRoute path="/admin/products/:id/edit" component={AdminProductEdit} />
        <ProtectedAdminRoute path="/admin/categories" component={CategoriesList} />
        <ProtectedAdminRoute path="/admin/categories/create" component={() => <CategoryForm mode="create" />} />
        <ProtectedAdminRoute path="/admin/categories/edit/:id" component={CategoryEditWrapper} />
        <ProtectedAdminRoute path="/admin/tags" component={TagsList} />
        <ProtectedAdminRoute path="/admin/tags/create" component={() => <TagForm mode="create" />} />
        <ProtectedAdminRoute path="/admin/tags/:id/edit" component={TagEditWrapper} />
        <ProtectedAdminRoute path="/admin/stock" component={StockPage} />
        <ProtectedAdminRoute path="/admin/users" component={UsersPage} />
        <ProtectedAdminRoute path="/admin/settings" component={SettingsPage} />
        
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
