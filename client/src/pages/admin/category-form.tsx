import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { insertCategorySchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { ArrowLeft, Save, Folder } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { ProtectedAdminRoute } from "@/lib/protected-admin-route";
import type { Category } from "@shared/schema";

// Extended form schema using shared schema
const categoryFormSchema = insertCategorySchema.extend({
  parentId: z.string().optional(),
  imagemUrl: z.string()
    .url("URL da imagem inválida")
    .optional()
    .or(z.literal("")),
  isActive: z.boolean().default(true),
  ordem: z.coerce.number()
    .int("Ordem deve ser um número inteiro")
    .min(0, "Ordem deve ser positiva")
    .optional(),
  slug: z.string().optional(), // Auto-generated from nome
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  mode: "create" | "edit";
  id?: string;
}

export function CategoryForm({ mode, id }: CategoryFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Check permissions
  const canCreate = user?.role === "super_admin" || user?.role === "manager";
  const canEdit = user?.role === "super_admin" || user?.role === "manager";

  if ((mode === "create" && !canCreate) || (mode === "edit" && !canEdit)) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive">Você não tem permissão para esta ação.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Fetch existing category for edit mode
  const { data: category, isLoading: isLoadingCategory } = useQuery<Category>({
    queryKey: ["/api/categories", id],
    enabled: mode === "edit" && !!id,
  });

  // Fetch all categories for parent selection
  const { data: allCategories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      parentId: "",
      imagemUrl: "",
      isActive: true,
      ordem: 0,
    },
  });

  // Update form when category data loads
  React.useEffect(() => {
    if (mode === "edit" && category) {
      form.reset({
        nome: category.nome || "",
        descricao: category.descricao || "",
        parentId: category.parentId || "",
        imagemUrl: category.imagemUrl || "",
        isActive: category.isActive ?? true,
        ordem: category.ordem || 0,
      });
    }
  }, [category, mode, form]);

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      // Generate slug from nome
      const slug = data.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const categoryData = {
        ...data,
        slug,
        parentId: data.parentId === "" ? null : data.parentId,
        imagemUrl: data.imagemUrl === "" ? null : data.imagemUrl,
      };

      return await apiRequest("POST", "/api/admin/categories", categoryData);
    },
    onSuccess: () => {
      toast({
        title: "Categoria criada com sucesso!",
        description: "A categoria foi adicionada ao sistema.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setLocation("/admin/categories");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar categoria",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      // Generate slug from nome if nome is being updated
      const slug = data.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const categoryData = {
        ...data,
        slug,
        parentId: data.parentId === "" ? null : data.parentId,
        imagemUrl: data.imagemUrl === "" ? null : data.imagemUrl,
      };

      return await apiRequest("PUT", `/api/admin/categories/${id}`, categoryData);
    },
    onSuccess: () => {
      toast({
        title: "Categoria atualizada com sucesso!",
        description: "As alterações foram salvas.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories", id] });
      setLocation("/admin/categories");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar categoria",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    if (mode === "create") {
      createCategoryMutation.mutate(data);
    } else {
      updateCategoryMutation.mutate(data);
    }
  };

  const isLoading = createCategoryMutation.isPending || updateCategoryMutation.isPending;

  if (mode === "edit" && isLoadingCategory) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando categoria...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Filter categories for parent selection (exclude self and children in edit mode)
  const availableParentCategories = allCategories.filter(cat => {
    if (mode === "edit" && id) {
      return cat.id !== id && cat.parentId !== id;
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation("/admin/categories")}
            className="flex items-center gap-2"
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === "create" ? "Nova Categoria" : "Editar Categoria"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "create" 
                ? "Adicione uma nova categoria para organizar produtos" 
                : "Modifique os dados da categoria"}
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Categoria</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Digite o nome da categoria" 
                          data-testid="input-name"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        O nome aparecerá na navegação e filtros
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva a categoria (opcional)"
                          className="min-h-[100px]"
                          data-testid="input-description"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Descrição para ajudar na organização interna
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria Pai</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-parent">
                            <SelectValue placeholder="Selecione uma categoria pai (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Nenhuma (categoria raiz)</SelectItem>
                          {availableParentCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Deixe em branco para criar uma categoria principal
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="imagemUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL da Imagem</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://exemplo.com/imagem.jpg" 
                          data-testid="input-image-url"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Imagem representativa da categoria (opcional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ordem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem de Exibição</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="0"
                          placeholder="0"
                          data-testid="input-order"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Ordem de exibição na listagem (0 = primeiro)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Categoria Ativa</FormLabel>
                        <FormDescription>
                          Categorias ativas aparecem na navegação do site
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Image preview */}
                {form.watch("imagemUrl") && (
                  <div className="mt-4">
                    <FormLabel>Preview da Imagem</FormLabel>
                    <div className="mt-2 border rounded-lg overflow-hidden max-w-xs">
                      <img 
                        src={form.watch("imagemUrl")} 
                        alt="Preview da categoria"
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button 
                variant="outline" 
                onClick={() => setLocation("/admin/categories")}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-[120px]"
                data-testid="button-save"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {mode === "create" ? "Criar Categoria" : "Salvar Alterações"}
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}