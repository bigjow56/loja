import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ColorPicker } from "@/components/ui/color-picker";
import { ArrowLeft, Save, Palette, Tag as TagIcon } from "lucide-react";
import { insertTagSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import type { Tag } from "@shared/schema";

// Extended form schema
const tagFormSchema = insertTagSchema.extend({
  isActive: z.boolean().default(true),
});

type TagFormData = z.infer<typeof tagFormSchema>;

interface TagFormProps {
  mode: "create" | "edit";
  id?: string;
}

export function TagForm({ mode, id }: TagFormProps) {
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

  // Fetch existing tag for edit mode
  const { data: tag, isLoading: isLoadingTag } = useQuery<Tag>({
    queryKey: ["/api/tags/" + id],
    enabled: mode === "edit" && !!id,
  });

  const form = useForm<TagFormData>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      nome: "",
      slug: "",
      cor: "#3B82F6",
      isActive: true,
    },
  });

  // Auto-generate slug from name
  const watchedNome = form.watch("nome");
  useEffect(() => {
    if (watchedNome && mode === "create") {
      const slug = watchedNome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-") // Remove multiple consecutive hyphens
        .trim();
      form.setValue("slug", slug);
    }
  }, [watchedNome, form, mode]);

  // Update form when tag data loads
  useEffect(() => {
    if (mode === "edit" && tag) {
      form.reset({
        nome: tag.nome || "",
        slug: tag.slug || "",
        cor: tag.cor || "#3B82F6",
        isActive: tag.isActive ?? true,
      });
    }
  }, [tag, mode, form]);

  // Create tag mutation
  const createMutation = useMutation({
    mutationFn: async (data: TagFormData) => {
      return apiRequest("POST", "/api/admin/tags", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      toast({
        title: "Tag criada",
        description: "A tag foi criada com sucesso.",
      });
      setLocation("/admin/tags");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao criar tag.",
        variant: "destructive",
      });
    },
  });

  // Update tag mutation
  const updateMutation = useMutation({
    mutationFn: async (data: TagFormData) => {
      return apiRequest("PUT", `/api/admin/tags/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tags", id] });
      toast({
        title: "Tag atualizada",
        description: "A tag foi atualizada com sucesso.",
      });
      setLocation("/admin/tags");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar tag.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TagFormData) => {
    if (mode === "create") {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (mode === "edit" && isLoadingTag) {
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
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/admin/tags")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {mode === "create" ? "Nova Tag" : "Editar Tag"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "create" 
                ? "Crie uma nova tag para organizar produtos"
                : "Edite as informações da tag"
              }
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TagIcon className="mr-2 h-5 w-5" />
                Informações da Tag
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Tag *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Promoção"
                              {...field}
                              data-testid="input-nome"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="promocao"
                              {...field}
                              data-testid="input-slug"
                            />
                          </FormControl>
                          <FormMessage />
                          <p className="text-xs text-muted-foreground">
                            Usado em URLs. Gerado automaticamente do nome.
                          </p>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="cor"
                    render={({ field }) => (
                      <FormItem>
                        <ColorPicker
                          label="Cor da Tag *"
                          value={field.value}
                          onChange={field.onChange}
                        />
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          Esta cor será usada para exibir a tag nos produtos.
                        </p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Tag Ativa</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Tags ativas podem ser associadas a produtos
                          </div>
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

                  <div className="flex gap-4 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/admin/tags")}
                      data-testid="button-cancel"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      data-testid="button-save"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isLoading ? "Salvando..." : (mode === "create" ? "Criar Tag" : "Salvar Alterações")}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="mr-2 h-5 w-5" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Como aparecerá no produto:</p>
                <div className="flex flex-wrap gap-2">
                  {form.watch("nome") && (
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: form.watch("cor") }}
                      data-testid="tag-preview"
                    >
                      {form.watch("nome")}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Informações:</p>
                <div className="space-y-1 text-sm">
                  <div>Nome: {form.watch("nome") || "—"}</div>
                  <div>Slug: {form.watch("slug") || "—"}</div>
                  <div>Cor: {form.watch("cor") || "—"}</div>
                  <div>Status: {form.watch("isActive") ? "Ativa" : "Inativa"}</div>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Exemplos de uso:</p>
                <div className="text-xs space-y-1">
                  <div>• Promoção (vermelho)</div>
                  <div>• Lançamento (azul)</div>
                  <div>• Desconto (verde)</div>
                  <div>• Limitado (laranja)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}