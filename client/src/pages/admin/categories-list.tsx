import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { Plus, Edit, Trash2, Eye, EyeOff, ChevronRight, Folder } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { Category } from "@shared/schema";

export function CategoriesList() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Check permissions
  const canCreate = user?.role === "super_admin" || user?.role === "manager";
  const canEdit = user?.role === "super_admin" || user?.role === "manager";
  const canDelete = user?.role === "super_admin";

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const deleteCategory = useMutation({
    mutationFn: async (categoryId: string) => {
      return await apiRequest("DELETE", `/api/admin/categories/${categoryId}`);
    },
    onSuccess: () => {
      toast({
        title: "Categoria excluída com sucesso!",
        description: "A categoria foi removida do sistema.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir categoria",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ categoryId, isActive }: { categoryId: string; isActive: boolean }) => {
      return await apiRequest("PUT", `/api/admin/categories/${categoryId}`, { isActive });
    },
    onSuccess: () => {
      toast({
        title: "Status da categoria atualizado!",
        description: "O status foi alterado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  // Helper function to organize categories in hierarchy
  const organizeCategories = (categories: Category[]) => {
    const rootCategories = categories.filter(cat => !cat.parentId);
    const childCategories = categories.filter(cat => cat.parentId);

    const addChildren = (category: Category): Category & { children: Category[] } => {
      const children = childCategories.filter(child => child.parentId === category.id);
      return {
        ...category,
        children: children.map(addChildren)
      };
    };

    return rootCategories.map(addChildren);
  };

  const hierarchicalCategories = organizeCategories(categories);

  const renderCategory = (category: Category & { children?: Category[] }, level: number = 0) => (
    <div key={category.id} className="border-b last:border-b-0">
      <div className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
        <div className="flex items-center space-x-3" style={{ paddingLeft: `${level * 24}px` }}>
          {level > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <Folder className="h-5 w-5 text-blue-600" />
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-sm" data-testid={`text-category-name-${category.id}`}>
                {category.nome}
              </h3>
              <Badge 
                variant={category.isActive ? "default" : "secondary"}
                className="text-xs"
                data-testid={`badge-status-${category.id}`}
              >
                {category.isActive ? "Ativa" : "Inativa"}
              </Badge>
            </div>
            
            {category.descricao && (
              <p className="text-xs text-muted-foreground mt-1" data-testid={`text-description-${category.id}`}>
                {category.descricao}
              </p>
            )}
            
            <p className="text-xs text-muted-foreground">
              Ordem: {category.ordem || 0}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {canEdit && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleStatus.mutate({ 
                  categoryId: category.id, 
                  isActive: !category.isActive 
                })}
                disabled={toggleStatus.isPending}
                data-testid={`button-toggle-${category.id}`}
              >
                {category.isActive ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation(`/admin/categories/edit/${category.id}`)}
                data-testid={`button-edit-${category.id}`}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm("Tem certeza que deseja excluir esta categoria?")) {
                  deleteCategory.mutate(category.id);
                }
              }}
              disabled={deleteCategory.isPending}
              data-testid={`button-delete-${category.id}`}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Render children */}
      {category.children?.map(child => renderCategory(child, level + 1))}
    </div>
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Folder className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Carregando categorias...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Categorias</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie categorias e subcategorias dos produtos
            </p>
          </div>
          
          {canCreate && (
            <Button 
              onClick={() => setLocation("/admin/categories/create")}
              className="flex items-center gap-2"
              data-testid="button-create-category"
            >
              <Plus className="h-4 w-4" />
              Nova Categoria
            </Button>
          )}
        </div>

        {/* Categories list */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Categorias ({categories.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {hierarchicalCategories.length === 0 ? (
              <div className="text-center p-8">
                <Folder className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma categoria encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  Comece criando uma nova categoria para organizar seus produtos.
                </p>
                {canCreate && (
                  <Button 
                    onClick={() => setLocation("/admin/categories/create")}
                    data-testid="button-create-first-category"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Categoria
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {hierarchicalCategories.map(category => renderCategory(category))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}