import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { X, Upload, Star, StarOff, GripVertical, Image as ImageIcon } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ProductImage } from "@shared/schema";

interface MultiImageUploadProps {
  productId?: string;
  onImagesChange?: (images: ProductImage[]) => void;
  maxImages?: number;
}

export function MultiImageUpload({ 
  productId, 
  onImagesChange, 
  maxImages = 10 
}: MultiImageUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing images if productId is provided
  const { data: images = [], isLoading } = useQuery<ProductImage[]>({
    queryKey: ["/api/products/" + productId + "/images"],
    enabled: !!productId,
  });

  // Add image mutation
  const addImageMutation = useMutation({
    mutationFn: async (imageData: { url: string; altText?: string; ordem: number }) => {
      if (!productId) throw new Error("Product ID required");
      
      return apiRequest("POST", `/api/admin/products/${productId}/images`, imageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/" + productId + "/images"] });
      toast({
        title: "Imagem adicionada",
        description: "A imagem foi adicionada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao adicionar imagem.",
        variant: "destructive",
      });
    },
  });

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      return apiRequest("DELETE", `/api/admin/products/${productId}/images/${imageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/" + productId + "/images"] });
      toast({
        title: "Imagem removida",
        description: "A imagem foi removida com sucesso.",
      });
    },
  });

  // Set primary image mutation
  const setPrimaryMutation = useMutation({
    mutationFn: async (imageId: string) => {
      return apiRequest("PUT", `/api/admin/products/${productId}/images/${imageId}/primary`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/" + productId + "/images"] });
      toast({
        title: "Imagem principal definida",
        description: "A imagem principal foi atualizada.",
      });
    },
  });

  // Reorder images mutation
  const reorderMutation = useMutation({
    mutationFn: async (imageOrders: { id: string; ordem: number }[]) => {
      return apiRequest("PUT", `/api/admin/products/${productId}/images/reorder`, { imageOrders });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products/" + productId + "/images"] });
    },
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFiles = async (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      });
      return;
    }

    if (images.length + imageFiles.length > maxImages) {
      toast({
        title: "Limite excedido",
        description: `Máximo de ${maxImages} imagens permitidas.`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Simulate upload to a service (in a real app, you'd upload to a file service)
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        
        // Create object URL for preview (in production, upload to storage service)
        const url = URL.createObjectURL(file);
        const ordem = images.length + i;
        
        if (productId) {
          await addImageMutation.mutateAsync({
            url,
            altText: file.name,
            ordem,
          });
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const newImages = [...images];
    const [moved] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, moved);
    
    // Update order for all images
    const imageOrders = newImages.map((img, index) => ({
      id: img.id,
      ordem: index,
    }));
    
    reorderMutation.mutate(imageOrders);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label>Imagens do Produto</Label>
      
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          dragOver 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
      >
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <div className="mb-4">
            <p className="text-lg font-medium">
              Arraste imagens aqui ou clique para selecionar
            </p>
            <p className="text-sm text-muted-foreground">
              Máximo de {maxImages} imagens. Formatos: JPG, PNG, WebP
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            data-testid="button-upload-images"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Enviando..." : "Selecionar Imagens"}
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card
              key={image.id}
              className="group relative overflow-hidden"
              data-testid={`image-preview-${image.id}`}
            >
              <CardContent className="p-2">
                <div className="relative aspect-square">
                  <img
                    src={image.url}
                    alt={image.altText || `Imagem ${index + 1}`}
                    className="w-full h-full object-cover rounded-md"
                  />
                  
                  {/* Overlay with controls */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPrimaryMutation.mutate(image.id)}
                      disabled={setPrimaryMutation.isPending}
                      data-testid={`button-primary-${image.id}`}
                    >
                      {image.isPrimary ? (
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteImageMutation.mutate(image.id)}
                      disabled={deleteImageMutation.isPending}
                      data-testid={`button-delete-${image.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Primary badge */}
                  {image.isPrimary && (
                    <Badge 
                      className="absolute top-2 left-2 bg-yellow-500 text-yellow-900"
                      data-testid={`badge-primary-${image.id}`}
                    >
                      Principal
                    </Badge>
                  )}

                  {/* Drag handle */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-4 w-4 text-white cursor-move" />
                  </div>
                </div>

                {/* Image info */}
                <div className="mt-2 text-xs text-muted-foreground">
                  Ordem: {(image.ordem || 0) + 1}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Instructions */}
      {images.length > 1 && (
        <p className="text-sm text-muted-foreground">
          💡 Passe o mouse sobre uma imagem para ver as opções. Clique na estrela para definir como imagem principal.
        </p>
      )}
    </div>
  );
}