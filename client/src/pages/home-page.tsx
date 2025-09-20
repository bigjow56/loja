import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { Product } from "@shared/schema";

export default function HomePage() {
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero Section Skeleton */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-accent/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center max-w-3xl mx-auto">
              <Skeleton className="h-12 w-3/4 mx-auto mb-6" />
              <Skeleton className="h-6 w-full mb-4" />
              <Skeleton className="h-6 w-2/3 mx-auto mb-8" />
              <Skeleton className="h-12 w-40 mx-auto" />
            </div>
          </div>
        </section>

        {/* Products Section Skeleton */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-48 w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <main className="bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-accent/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-3xl mx-auto">
            <h1 
              className="text-4xl md:text-6xl font-bold text-foreground mb-6"
              data-testid="hero-title"
            >
              Descubra Produtos Premium
            </h1>
            <p 
              className="text-xl text-muted-foreground mb-8 leading-relaxed"
              data-testid="hero-description"
            >
              Compre a mais recente coleção de itens de alta qualidade cuidadosamente selecionados para estilos de vida modernos
            </p>
            <Button 
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg"
              onClick={() => {
                document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              data-testid="shop-now-button"
            >
              Comprar Agora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Categorias em Destaque
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group cursor-pointer" data-testid="category-electronics">
              <div 
                className="relative overflow-hidden rounded-xl bg-muted h-64"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1498049794561-7780e7231661?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600')",
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              >
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-xl font-semibold mb-2">Eletrônicos</h3>
                  <p className="text-sm opacity-90">120+ itens</p>
                </div>
              </div>
            </div>

            <div className="group cursor-pointer" data-testid="category-fashion">
              <div 
                className="relative overflow-hidden rounded-xl bg-muted h-64"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600')",
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              >
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-xl font-semibold mb-2">Moda</h3>
                  <p className="text-sm opacity-90">85+ itens</p>
                </div>
              </div>
            </div>

            <div className="group cursor-pointer" data-testid="category-home">
              <div 
                className="relative overflow-hidden rounded-xl bg-muted h-64"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600')",
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              >
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-xl font-semibold mb-2">Casa & Vida</h3>
                  <p className="text-sm opacity-90">95+ itens</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-16 bg-background" id="products-section">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-foreground">Produtos em Destaque</h2>
            <div className="flex items-center space-x-4">
              <select 
                className="border border-border rounded-lg px-4 py-2 bg-card focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="sort-select"
              >
                <option>Ordenar por: Destaque</option>
                <option>Preço: Menor para Maior</option>
                <option>Preço: Maior para Menor</option>
                <option>Mais Recentes</option>
              </select>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground" data-testid="no-products-message">
                Nenhum produto encontrado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Load More Button */}
          <div className="text-center mt-12">
            <Button 
              variant="secondary"
              className="px-8 py-3"
              data-testid="load-more-button"
            >
              Carregar Mais Produtos
              <ChevronDown className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Mantenha-se Atualizado
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Subscreva a nossa newsletter e seja o primeiro a saber sobre novos produtos, ofertas exclusivas e descontos especiais.
          </p>
          <div className="max-w-md mx-auto flex gap-4">
            <input 
              type="email" 
              placeholder="Digite seu endereço de e-mail" 
              className="flex-1 px-4 py-3 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-white/50"
              data-testid="newsletter-input"
            />
            <Button 
              className="bg-white text-primary px-6 py-3 hover:bg-white/90"
              data-testid="newsletter-submit"
            >
              Subscrever
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
