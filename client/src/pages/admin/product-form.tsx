import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { ArrowLeft, Save, Package } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import type { Category } from "@shared/schema";

// Enhanced form schema with comprehensive validation
const productFormSchema = z.object({
  nome: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(255, "Nome muito longo"),
  descricao: z.string()
    .min(10, "Descrição deve ter pelo menos 10 caracteres")
    .max(1000, "Descrição muito longa"),
  preco: z.string()
    .min(1, "Preço é obrigatório")
    .refine((val) => {
      const num = parseFloat(val.replace(",", "."));
      return !isNaN(num) && num > 0;
    }, "Preço deve ser um número válido maior que zero"),
  marca: z.string()
    .min(1, "Marca é obrigatória")
    .max(100, "Nome da marca muito longo"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  categoryId: z.string().optional(),
  imageUrl: z.string()
    .min(1, "URL da imagem é obrigatória")
    .url("URL da imagem deve ser válida"),
  sku: z.string()
    .max(100, "SKU muito longo")
    .optional(),
  status: z.enum(["rascunho", "publicado", "inativo"]),
  isFeatured: z.boolean(),
  estoque: z.coerce.number()
    .int("Estoque deve ser um número inteiro")
    .min(0, "Estoque não pode ser negativo"),
  estoqueMinimo: z.coerce.number()
    .int("Estoque mínimo deve ser um número inteiro")
    .min(0, "Estoque mínimo não pode ser negativo")
    .default(5),
  peso: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === "") return true;
      const num = parseFloat(val.replace(",", "."));
      return !isNaN(num) && num > 0;
    }, "Peso deve ser um número válido"),
  descricaoRica: z.string()
    .max(5000, "Descrição rica muito longa")
    .optional(),
  precoPromocional: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === "") return true;
      const num = parseFloat(val.replace(",", "."));
      return !isNaN(num) && num > 0;
    }, "Preço promocional deve ser um número válido"),
  precoAnterior: z.string().optional(),
  avaliacao: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === "") return true;
      const num = parseFloat(val.replace(",", "."));
      return !isNaN(num) && num >= 0 && num <= 5;
    }, "Avaliação deve ser entre 0 e 5"),
  totalAvaliacoes: z.coerce.number().int().min(0).optional(),
  vendas: z.coerce.number().int().min(0).optional(),
  desconto: z.coerce.number()
    .int("Desconto deve ser um número inteiro")
    .min(0, "Desconto não pode ser negativo")
    .max(100, "Desconto não pode ser maior que 100%")
    .optional(),
  dimensoes: z.string()
    .max(255, "Dimensões muito longas")
    .optional(),
  permitirVendaSemEstoque: z.boolean().default(false),
}).refine((data) => {
  // Cross-field validation: promotional price should be less than regular price
  if (data.precoPromocional && data.preco) {
    const preco = parseFloat(data.preco.replace(",", "."));
    const precoPromo = parseFloat(data.precoPromocional.replace(",", "."));
    return precoPromo < preco;
  }
  return true;
}, {
  message: "Preço promocional deve ser menor que o preço regular",
  path: ["precoPromocional"],
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  mode: "create" | "edit";
}

export function ProductForm({ mode }: ProductFormProps) {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing product for edit mode
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ["/api/products", id],
    enabled: mode === "edit" && !!id,
  });

  // Fetch categories for the dropdown
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      preco: "",
      marca: "",
      categoria: "",
      imageUrl: "",
      sku: "",
      status: "rascunho",
      isFeatured: false,
      estoque: 0,
      estoqueMinimo: 0,
      peso: "",
      categoryId: "",
      descricaoRica: "",
      precoPromocional: "",
      precoAnterior: "",
      avaliacao: "5.0",
      totalAvaliacoes: 0,
      vendas: 0,
      desconto: 0,
      dimensoes: "",
      permitirVendaSemEstoque: false,
    },
  });

  // Update form when product data is loaded
  React.useEffect(() => {
    if (product && mode === "edit") {
      form.reset({
        nome: (product as any)?.nome || "",
        descricao: (product as any)?.descricao || "",
        preco: (product as any)?.preco || "",
        marca: (product as any)?.marca || "",
        categoria: (product as any)?.categoria || "",
        imageUrl: (product as any)?.imageUrl || "",
        sku: (product as any)?.sku || "",
        status: (product as any)?.status || "rascunho",
        isFeatured: (product as any)?.isFeatured || false,
        estoque: (product as any)?.estoque || 0,
        estoqueMinimo: (product as any)?.estoqueMinimo || 0,
        peso: (product as any)?.peso || "",
        categoryId: (product as any)?.categoryId || "",
        descricaoRica: (product as any)?.descricaoRica || "",
        precoPromocional: (product as any)?.precoPromocional || "",
        precoAnterior: (product as any)?.precoAnterior || "",
        avaliacao: (product as any)?.avaliacao || "5.0",
        totalAvaliacoes: (product as any)?.totalAvaliacoes || 0,
        vendas: (product as any)?.vendas || 0,
        desconto: (product as any)?.desconto || 0,
        dimensoes: (product as any)?.dimensoes || "",
        permitirVendaSemEstoque: (product as any)?.permitirVendaSemEstoque || false,
      });
    }
  }, [product, mode, form]);

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      // Generate slug from nome
      const slug = data.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const productData = {
        ...data,
        slug,
        preco: parseFloat(data.preco.replace(",", ".")),
        peso: data.peso ? parseFloat(data.peso.replace(",", ".")) : null,
        precoPromocional: data.precoPromocional ? parseFloat(data.precoPromocional.replace(",", ".")) : null,
        precoAnterior: data.precoAnterior ? parseFloat(data.precoAnterior.replace(",", ".")) : null,
        avaliacao: data.avaliacao ? parseFloat(data.avaliacao.replace(",", ".")) : 5.0,
      };

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar produto");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Produto criado com sucesso!",
        description: "O produto foi adicionado ao catálogo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      setLocation("/admin/products");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar produto",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      // Generate slug from nome if nome is being updated
      const slug = data.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const productData = {
        ...data,
        slug,
        preco: parseFloat(data.preco.replace(",", ".")),
        peso: data.peso ? parseFloat(data.peso.replace(",", ".")) : null,
        precoPromocional: data.precoPromocional ? parseFloat(data.precoPromocional.replace(",", ".")) : null,
        precoAnterior: data.precoAnterior ? parseFloat(data.precoAnterior.replace(",", ".")) : null,
        avaliacao: data.avaliacao ? parseFloat(data.avaliacao.replace(",", ".")) : 5.0,
      };

      const response = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao atualizar produto");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Produto atualizado com sucesso!",
        description: "As alterações foram salvas.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", id] });
      setLocation("/admin/products");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar produto",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    if (mode === "create") {
      createProductMutation.mutate(data);
    } else {
      updateProductMutation.mutate(data);
    }
  };

  const isLoading = createProductMutation.isPending || updateProductMutation.isPending;

  if (mode === "edit" && isLoadingProduct) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Carregando produto...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (mode === "edit" && !product && !isLoadingProduct) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Produto não encontrado</p>
            <Button
              variant="outline"
              onClick={() => setLocation("/admin/products")}
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para produtos
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/admin/products")}
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">
                {mode === "create" ? "Novo Produto" : "Editar Produto"}
              </h1>
              <p className="text-muted-foreground">
                {mode === "create" 
                  ? "Adicione um novo produto ao catálogo" 
                  : "Altere as informações do produto"}
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Informações básicas */}
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
                        <FormLabel>Nome do Produto</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Digite o nome do produto" 
                            data-testid="input-product-name"
                            {...field} 
                          />
                        </FormControl>
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
                            placeholder="Descreva o produto" 
                            className="min-h-[100px]"
                            data-testid="input-description"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="marca"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Digite a marca" 
                            data-testid="input-brand"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="categoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          // Find the category and set categoryId
                          const category = categories.find(cat => cat.nome === value);
                          if (category) {
                            form.setValue("categoryId", category.id);
                          }
                        }} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-categoria">
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.length > 0 ? (
                              categories.map((category) => (
                                <SelectItem key={category.id} value={category.nome}>
                                  {category.nome}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="geral">Geral</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Código do produto" 
                            data-testid="input-sku"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Preço e estoque */}
              <Card>
                <CardHeader>
                  <CardTitle>Preço e Estoque</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="preco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="0,00" 
                            data-testid="input-price"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estoque"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estoque Atual</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            data-testid="input-stock"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estoqueMinimo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estoque Mínimo</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            data-testid="input-min-stock"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Quantidade mínima para alertas de estoque baixo
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="precoPromocional"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço Promocional (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="0,00" 
                            data-testid="input-promo-price"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Deixe vazio se não há promoção
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="peso"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Peso (kg)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="0,0" 
                            data-testid="input-weight"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Status e configurações */}
              <Card>
                <CardHeader>
                  <CardTitle>Status e Configurações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="publicado">Publicado</SelectItem>
                            <SelectItem value="rascunho">Rascunho</SelectItem>
                            <SelectItem value="inativo">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Produto em Destaque</FormLabel>
                          <FormDescription>
                            Exibir este produto na seção de destaques
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-featured"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="permitirVendaSemEstoque"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Permitir Venda sem Estoque</FormLabel>
                          <FormDescription>
                            Permitir vendas mesmo quando estoque for zero
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-allow-oversell"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Campos Avançados */}
              <Card>
                <CardHeader>
                  <CardTitle>Campos Avançados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="descricaoRica"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição Rica (HTML)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descrição detalhada com formatação HTML..."
                            className="min-h-[120px]"
                            data-testid="input-rich-description"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Descrição detalhada com suporte a HTML básico
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dimensoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dimensões</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="20x15x10 cm"
                            data-testid="input-dimensions"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Comprimento x Largura x Altura
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="desconto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Desconto (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            max="100"
                            placeholder="0"
                            data-testid="input-discount"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Percentual de desconto (0-100%)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Imagens */}
              <Card>
                <CardHeader>
                  <CardTitle>Imagens</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Imagem Principal (URL)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://exemplo.com/imagem.jpg" 
                            data-testid="input-main-image"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          URL da imagem principal do produto
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Preview da imagem */}
                  {form.watch("imageUrl") && (
                    <div className="mt-4">
                      <FormLabel>Preview da Imagem</FormLabel>
                      <div className="mt-2 border rounded-lg overflow-hidden max-w-xs">
                        <img 
                          src={form.watch("imageUrl")} 
                          alt="Preview do produto"
                          className="w-full h-48 object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/admin/products")}
                disabled={isLoading}
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
                {isLoading ? "Salvando..." : "Salvar Produto"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}