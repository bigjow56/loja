import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Grid, List, ChevronDown, Star, Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ProductCard } from "@/components/product-card";
import type { ProductWithFavorite } from "@shared/schema";

const CATEGORIAS = ["Eletrônicos", "Roupas", "Casa", "Esportes"];
const MARCAS = ["Samsung", "Apple", "Nike", "Adidas", "Sony", "LG", "Zara", "H&M"];

export default function ProductsPage() {
  // States for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMarcas, setSelectedMarcas] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("relevancia");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch products
  const { data: products = [], isLoading } = useQuery<ProductWithFavorite[]>({
    queryKey: ["/api/products"],
  });

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      // Search filter
      if (searchTerm && !product.nome.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(product.categoria)) {
        return false;
      }
      
      // Brand filter
      if (selectedMarcas.length > 0 && !selectedMarcas.includes(product.marca)) {
        return false;
      }
      
      // Price filter
      const price = parseFloat(product.preco);
      if (price < priceRange[0] || price > priceRange[1]) {
        return false;
      }
      
      // Rating filter
      const rating = parseFloat(product.avaliacao);
      if (rating < minRating) {
        return false;
      }
      
      return true;
    });

    // Sort products
    switch (sortBy) {
      case "preco-asc":
        filtered.sort((a, b) => parseFloat(a.preco) - parseFloat(b.preco));
        break;
      case "preco-desc":
        filtered.sort((a, b) => parseFloat(b.preco) - parseFloat(a.preco));
        break;
      case "avaliacao":
        filtered.sort((a, b) => parseFloat(b.avaliacao) - parseFloat(a.avaliacao));
        break;
      case "vendas":
        filtered.sort((a, b) => b.vendas - a.vendas);
        break;
      default:
        // Keep original order for relevance
        break;
    }

    return filtered;
  }, [products, searchTerm, selectedCategories, selectedMarcas, priceRange, minRating, sortBy]);

  const toggleCategory = (categoria: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoria) 
        ? prev.filter(c => c !== categoria)
        : [...prev, categoria]
    );
  };

  const toggleMarca = (marca: string) => {
    setSelectedMarcas(prev => 
      prev.includes(marca) 
        ? prev.filter(m => m !== marca)
        : [...prev, marca]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategories([]);
    setSelectedMarcas([]);
    setPriceRange([0, 500]);
    setMinRating(0);
    setSortBy("relevancia");
  };

  const activeFiltersCount = selectedCategories.length + selectedMarcas.length + 
    (priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0) + (minRating > 0 ? 1 : 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-4" />
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1 max-w-md" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          
          <div className="flex gap-8">
            {/* Sidebar Skeleton */}
            <div className="hidden lg:block w-64 space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-32" />
              <Skeleton className="h-24" />
            </div>
            
            {/* Products Grid Skeleton */}
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6" data-testid="page-title">
            Produtos
          </h1>
          
          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                data-testid="search-input"
              />
            </div>
            
            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600" data-testid="sort-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevancia">Mais Relevantes</SelectItem>
                <SelectItem value="preco-asc">Menor Preço</SelectItem>
                <SelectItem value="preco-desc">Maior Preço</SelectItem>
                <SelectItem value="avaliacao">Melhor Avaliados</SelectItem>
                <SelectItem value="vendas">Mais Vendidos</SelectItem>
              </SelectContent>
            </Select>
            
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="px-3"
                data-testid="grid-view-button"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="px-3"
                data-testid="list-view-button"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Mobile Filter Toggle */}
            <Button
              variant="outline"
              className="lg:hidden bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              onClick={() => setShowFilters(!showFilters)}
              data-testid="mobile-filter-toggle"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-64 space-y-6`}>
            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Filtros</h3>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-blue-600 dark:text-blue-400"
                      data-testid="clear-filters-button"
                    >
                      Limpar
                    </Button>
                  )}
                </div>
                
                {/* Categories */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Categorias</h4>
                  <div className="space-y-2">
                    {CATEGORIAS.map((categoria) => (
                      <div key={categoria} className="flex items-center">
                        <Checkbox
                          id={`categoria-${categoria}`}
                          checked={selectedCategories.includes(categoria)}
                          onCheckedChange={() => toggleCategory(categoria)}
                          data-testid={`category-${categoria.toLowerCase()}`}
                        />
                        <label
                          htmlFor={`categoria-${categoria}`}
                          className="ml-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                        >
                          {categoria}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                {/* Brands */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Marcas</h4>
                  <div className="space-y-2">
                    {MARCAS.map((marca) => (
                      <div key={marca} className="flex items-center">
                        <Checkbox
                          id={`marca-${marca}`}
                          checked={selectedMarcas.includes(marca)}
                          onCheckedChange={() => toggleMarca(marca)}
                          data-testid={`brand-${marca.toLowerCase()}`}
                        />
                        <label
                          htmlFor={`marca-${marca}`}
                          className="ml-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                        >
                          {marca}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                {/* Price Range */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Faixa de Preço</h4>
                  <div className="px-2">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={500}
                      step={10}
                      className="mb-2"
                      data-testid="price-range-slider"
                    />
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>R$ {priceRange[0]}</span>
                      <span>R$ {priceRange[1]}</span>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                {/* Rating Filter */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Avaliação Mínima</h4>
                  <div className="space-y-2">
                    {[4, 3, 2, 1, 0].map((rating) => (
                      <div key={rating} className="flex items-center">
                        <Checkbox
                          id={`rating-${rating}`}
                          checked={minRating === rating}
                          onCheckedChange={() => setMinRating(minRating === rating ? 0 : rating)}
                          data-testid={`rating-${rating}`}
                        />
                        <label
                          htmlFor={`rating-${rating}`}
                          className="ml-2 flex items-center cursor-pointer"
                        >
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300 dark:text-gray-600"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="ml-1 text-sm text-gray-700 dark:text-gray-300">
                            {rating > 0 ? `${rating}+ estrelas` : "Todas"}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Results Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600 dark:text-gray-400" data-testid="results-count">
                {filteredAndSortedProducts.length} produtos encontrados
              </p>
              
              {/* Active Filters */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((categoria) => (
                    <Badge
                      key={categoria}
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      data-testid={`active-filter-${categoria.toLowerCase()}`}
                    >
                      {categoria}
                      <button
                        onClick={() => toggleCategory(categoria)}
                        className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  {selectedMarcas.map((marca) => (
                    <Badge
                      key={marca}
                      variant="secondary"
                      className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      data-testid={`active-filter-${marca.toLowerCase()}`}
                    >
                      {marca}
                      <button
                        onClick={() => toggleMarca(marca)}
                        className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {/* Products */}
            {filteredAndSortedProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="mb-4">
                  <Search className="mx-auto w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nenhum produto encontrado
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Tente ajustar seus filtros ou termos de busca
                </p>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900"
                  data-testid="clear-all-filters-button"
                >
                  Limpar todos os filtros
                </Button>
              </div>
            ) : (
              <div className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }>
                {filteredAndSortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} viewMode={viewMode} />
                ))}
              </div>
            )}
            
            {/* Load More Button - Placeholder for future pagination */}
            {filteredAndSortedProducts.length > 0 && (
              <div className="text-center mt-12">
                <Button
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900"
                  data-testid="load-more-button"
                >
                  Carregar mais produtos
                  <ChevronDown className="ml-2 w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}