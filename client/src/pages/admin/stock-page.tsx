import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminLayout } from "@/components/admin-layout";
import { AlertTriangle, Package, TrendingUp, TrendingDown, BarChart3, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  minimumStock: number;
  variationName?: string;
}

interface StockSummary {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: number;
}

export function StockPage() {
  const { toast } = useToast();

  // Fetch stock alerts
  const { data: stockAlerts = [], isLoading: isLoadingAlerts } = useQuery<StockAlert[]>({
    queryKey: ["/api/admin/stock/alerts"],
  });

  // Fetch stock summary
  const { data: stockSummary, isLoading: isLoadingSummary } = useQuery<StockSummary>({
    queryKey: ["/api/admin/stock/summary"],
  });

  const handleRefreshStock = () => {
    // Invalidate queries to refresh data
    toast({
      title: "Atualizando estoque",
      description: "Os dados de estoque estão sendo atualizados...",
    });
  };

  const getStockLevel = (current: number, minimum: number) => {
    if (current === 0) return "out";
    if (current <= minimum) return "low";
    return "normal";
  };

  const getStockBadge = (level: string) => {
    switch (level) {
      case "out":
        return <Badge variant="destructive">Esgotado</Badge>;
      case "low":
        return <Badge variant="secondary">Estoque Baixo</Badge>;
      default:
        return <Badge variant="default">Normal</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Controle de Estoque</h1>
            <p className="text-muted-foreground">
              Monitore e gerencie o estoque dos seus produtos
            </p>
          </div>
          <Button onClick={handleRefreshStock} disabled={isLoadingAlerts || isLoadingSummary}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Stock Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingSummary ? "..." : stockSummary?.totalProducts || 0}
              </div>
              <p className="text-xs text-muted-foreground">produtos cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {isLoadingSummary ? "..." : stockSummary?.lowStockCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">produtos com estoque baixo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Esgotados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {isLoadingSummary ? "..." : stockSummary?.outOfStockCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">produtos esgotados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {isLoadingSummary ? "..." : `R$ ${(stockSummary?.totalValue || 0).toLocaleString("pt-BR")}`}
              </div>
              <p className="text-xs text-muted-foreground">valor do estoque</p>
            </CardContent>
          </Card>
        </div>

        {/* Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Alertas de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAlerts ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : stockAlerts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">Nenhum alerta</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Todos os produtos estão com estoque adequado.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {stockAlerts.map((alert) => (
                  <div key={alert.productId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{alert.productName}</h3>
                      {alert.variationName && (
                        <p className="text-sm text-muted-foreground">Variação: {alert.variationName}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Estoque atual: {alert.currentStock} / Mínimo: {alert.minimumStock}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStockBadge(getStockLevel(alert.currentStock, alert.minimumStock))}
                      <Button size="sm" variant="outline">
                        Ajustar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}