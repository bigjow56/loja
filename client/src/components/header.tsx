import { Link, useLocation } from "wouter";
import { Search, ShoppingCart, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/contexts/cart-context";
import { useState } from "react";

export function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { itemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <ShoppingCart className="text-primary-foreground w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-foreground">EliteShop</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className={`transition-colors font-medium ${
                location === "/" ? "text-primary" : "text-foreground hover:text-primary"
              }`}
              data-testid="nav-home"
            >
              Home
            </Link>
            <Link 
              href="/cart" 
              className={`transition-colors ${
                location === "/cart" ? "text-primary" : "text-muted-foreground hover:text-primary"
              }`}
              data-testid="nav-cart"
            >
              Carrinho
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="hidden sm:block relative">
              <Input
                type="text"
                placeholder="Pesquisar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
                data-testid="search-input"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            </div>

            {/* Cart Icon with Badge */}
            <Link href="/cart">
              <Button variant="ghost" size="sm" className="relative p-2" data-testid="cart-button">
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
                    data-testid="cart-badge"
                  >
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* User Account */}
            <div className="flex items-center space-x-2">
              {user ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground hidden sm:block">
                    Olá, {user.nome}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLogout}
                    data-testid="logout-button"
                  >
                    Sair
                  </Button>
                </div>
              ) : (
                <Link href="/auth">
                  <Button variant="ghost" size="sm" data-testid="login-button">
                    <User className="w-4 h-4 mr-2" />
                    Entrar
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="sm" className="md:hidden p-2" data-testid="mobile-menu-button">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
