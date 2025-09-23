import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Tag as TagIcon,
  MoreHorizontal,
  Eye,
  EyeOff
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/queryClient";
import type { Tag } from "@shared/schema";

export function TagsList() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Check permissions
  const canCreate = user?.role === "super_admin" || user?.role === "manager";
  const canEdit = user?.role === "super_admin" || user?.role === "manager";
  const canDelete = user?.role === "super_admin";

  const { data: tags = [], isLoading } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

  // Delete tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      return apiRequest("DELETE", `/api/admin/tags/${tagId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      toast({
        title: "Tag removida",
        description: "A tag foi removida com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao remover tag.",
        variant: "destructive",
      });
    },
  });

  // Toggle tag status mutation
  const toggleTagMutation = useMutation({
    mutationFn: async ({ tagId, isActive }: { tagId: string; isActive: boolean }) => {
      return apiRequest("PUT", `/api/admin/tags/${tagId}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      toast({
        title: "Status atualizado",
        description: "O status da tag foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao atualizar status da tag.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteTag = async (tagId: string, tagName: string) => {
    if (window.confirm(`Tem certeza que deseja remover a tag "${tagName}"? Esta ação não pode ser desfeita.`)) {
      deleteTagMutation.mutate(tagId);
    }
  };

  const handleToggleStatus = (tagId: string, currentStatus: boolean) => {
    toggleTagMutation.mutate({ tagId, isActive: !currentStatus });
  };

  // Filter tags based on search query
  const filteredTags = tags.filter(tag =>
    tag.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tag.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group tags by status for better organization
  const activeTags = filteredTags.filter(tag => tag.isActive);
  const inactiveTags = filteredTags.filter(tag => !tag.isActive);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Tags</h1>
            <p className="text-muted-foreground">
              Organize produtos com tags coloridas
            </p>
          </div>
          
          {canCreate && (
            <Button 
              onClick={() => setLocation("/admin/tags/create")}
              data-testid="button-create-tag"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Tag
            </Button>
          )}
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-tags"
            />
          </div>
          
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Total: {tags.length}</span>
            <span>Ativas: {activeTags.length}</span>
            <span>Inativas: {inactiveTags.length}</span>
          </div>
        </div>

        {/* Active Tags */}
        {activeTags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TagIcon className="mr-2 h-5 w-5" />
                Tags Ativas ({activeTags.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="group relative border rounded-lg p-4 hover:shadow-md transition-shadow"
                    data-testid={`tag-card-${tag.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            className="text-white font-medium"
                            style={{ backgroundColor: tag.cor }}
                            data-testid={`tag-badge-${tag.id}`}
                          >
                            {tag.nome}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {tag.slug}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          Cor: {tag.cor}
                        </div>
                      </div>

                      {(canEdit || canDelete) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              data-testid={`menu-${tag.id}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEdit && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => setLocation(`/admin/tags/${tag.id}/edit`)}
                                  data-testid={`edit-${tag.id}`}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggleStatus(tag.id, tag.isActive)}
                                  data-testid={`toggle-${tag.id}`}
                                >
                                  <EyeOff className="mr-2 h-4 w-4" />
                                  Desativar
                                </DropdownMenuItem>
                              </>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteTag(tag.id, tag.nome)}
                                className="text-destructive"
                                data-testid={`delete-${tag.id}`}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inactive Tags */}
        {inactiveTags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-muted-foreground">
                <EyeOff className="mr-2 h-5 w-5" />
                Tags Inativas ({inactiveTags.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inactiveTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="group relative border rounded-lg p-4 opacity-60 hover:opacity-80 transition-opacity"
                    data-testid={`inactive-tag-card-${tag.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="secondary"
                            className="text-muted-foreground"
                          >
                            {tag.nome}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {tag.slug}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          Cor: {tag.cor}
                        </div>
                      </div>

                      {canEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setLocation(`/admin/tags/${tag.id}/edit`)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(tag.id, tag.isActive)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ativar
                            </DropdownMenuItem>
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteTag(tag.id, tag.nome)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {filteredTags.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TagIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? "Nenhuma tag encontrada" : "Nenhuma tag criada"}
              </h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                {searchQuery 
                  ? "Tente ajustar os filtros de busca para encontrar as tags." 
                  : "Tags ajudam a organizar produtos por características especiais como promoções, lançamentos e descontos."
                }
              </p>
              {canCreate && !searchQuery && (
                <Button onClick={() => setLocation("/admin/tags/create")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Tag
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}