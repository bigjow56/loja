import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAnyAdminRole, requirePermission, requireAnyPermission } from "./auth";
import { insertCartItemSchema, insertOrderSchema, insertProductSchema, insertCategorySchema, insertTagSchema, insertProductImageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Query parameter validation schema
  const limitQuerySchema = z.object({
    limit: z.preprocess(
      (val) => (Array.isArray(val) ? val[0] : val),
      z.coerce.number().int().min(1).max(24).default(6)
    )
  });

  // Product recommendation routes (MUST come before /:id route to avoid conflicts)
  app.get("/api/products/bestsellers", async (req, res) => {
    try {
      const parseResult = limitQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid query parameters",
          errors: parseResult.error.errors
        });
      }
      
      const { limit } = parseResult.data;
      const bestsellingProducts = await storage.getBestsellingProducts(limit);
      res.json(bestsellingProducts);
    } catch (error) {
      console.error("Error fetching bestselling products:", error);
      res.status(500).json({ message: "Failed to fetch bestselling products" });
    }
  });

  app.get("/api/products/featured", async (req, res) => {
    try {
      const parseResult = limitQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid query parameters",
          errors: parseResult.error.errors
        });
      }
      
      const { limit } = parseResult.data;
      const featuredProducts = await storage.getFeaturedProducts(limit);
      res.json(featuredProducts);
    } catch (error) {
      console.error("Error fetching featured products:", error);
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  app.get("/api/products/:id/related", async (req, res) => {
    try {
      const parseResult = limitQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid query parameters",
          errors: parseResult.error.errors
        });
      }
      
      const { limit } = parseResult.data;

      // Check if the base product exists (for consistency with other product endpoints)
      const baseProduct = await storage.getProduct(req.params.id);
      if (!baseProduct) {
        return res.status(404).json({ message: "Product not found" });
      }

      const relatedProducts = await storage.getRelatedProducts(req.params.id, limit);
      res.json(relatedProducts);
    } catch (error) {
      console.error("Error fetching related products:", error);
      res.status(500).json({ message: "Failed to fetch related products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Cart routes (protected)
  app.get("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const cartItems = await storage.getCartItems(req.user!.id);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const cartItemData = insertCartItemSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      const cartItem = await storage.addToCart(cartItemData);
      res.status(201).json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(400).json({ message: "Failed to add item to cart" });
    }
  });

  app.put("/api/cart/:itemId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { quantidade } = req.body;
      if (typeof quantidade !== "number" || quantidade < 1) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      const updatedItem = await storage.updateCartItemQuantity(req.params.itemId, quantidade);
      if (!updatedItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }

      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:itemId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      await storage.removeFromCart(req.params.itemId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove item from cart" });
    }
  });

  // Checkout route (protected)
  app.post("/api/checkout", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const userId = req.user!.id;
      
      // Get cart items
      const cartItems = await storage.getCartItems(userId);
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      // Calculate total
      const total = cartItems.reduce((sum, item) => {
        return sum + (parseFloat(item.product.preco) * item.quantidade);
      }, 0);

      // Create order
      const order = await storage.createOrder({
        userId,
        status: "PROCESSANDO",
        total: total.toString(),
      });

      // Add order items
      for (const cartItem of cartItems) {
        await storage.addOrderItem({
          orderId: order.id,
          productId: cartItem.product.id,
          quantidade: cartItem.quantidade,
          preco: cartItem.product.preco,
        });
      }

      // Clear cart
      await storage.clearCart(userId);

      // Simulate payment processing
      setTimeout(async () => {
        // In a real app, this would be handled by a payment processor webhook
        console.log(`Payment processed for order ${order.id}`);
      }, 2000);

      res.status(201).json({
        order,
        message: "Order created successfully. Payment is being processed.",
      });
    } catch (error) {
      console.error("Error processing checkout:", error);
      res.status(500).json({ message: "Failed to process checkout" });
    }
  });

  // Orders route (protected)
  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const orders = await storage.getOrdersByUser(req.user!.id);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Admin routes (protected with specific permissions)
  app.get("/api/admin/dashboard", requirePermission("dashboard:view"), async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/admin/products", requirePermission("product:read"), async (req, res) => {
    try {
      const { search, status, category } = req.query;
      let products = await storage.getAllProducts();
      
      // Apply filters if provided
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        products = products.filter(product => 
          product.nome.toLowerCase().includes(searchLower) ||
          product.sku?.toLowerCase().includes(searchLower) ||
          product.marca.toLowerCase().includes(searchLower)
        );
      }
      
      if (status && status !== 'all' && typeof status === 'string') {
        products = products.filter(product => product.status === status);
      }
      
      if (category && category !== 'all' && typeof category === 'string') {
        products = products.filter(product => product.categoryId === category);
      }
      
      res.json(products);
    } catch (error) {
      console.error("Error fetching admin products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/admin/products", requirePermission("product:create"), async (req, res) => {
    try {
      const parseResult = insertProductSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          message: "Invalid product data",
          errors: parseResult.error.errors
        });
      }

      const product = await storage.createProduct(parseResult.data);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put("/api/admin/products/:id", requirePermission("product:update"), async (req, res) => {
    try {
      const parseResult = insertProductSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          message: "Invalid product data",
          errors: parseResult.error.errors
        });
      }

      const product = await storage.updateProduct(req.params.id, parseResult.data);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", requirePermission("product:delete"), async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      await storage.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  app.post("/api/admin/categories", requirePermission("category:manage"), async (req, res) => {
    try {
      const parseResult = insertCategorySchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          message: "Invalid category data",
          errors: parseResult.error.errors
        });
      }

      const categoryData = {
        ...parseResult.data,
        isActive: parseResult.data.isActive ?? true, // Default to true if undefined
        descricao: parseResult.data.descricao ?? null // Convert undefined to null
      };
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/admin/categories/:id", requirePermission("category:manage"), async (req, res) => {
    try {
      const parseResult = insertCategorySchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          message: "Invalid category data",
          errors: parseResult.error.errors
        });
      }

      const category = await storage.updateCategory(req.params.id, parseResult.data);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/admin/categories/:id", requirePermission("category:manage"), async (req, res) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      await storage.deleteCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Tags routes (admin only)
  app.get("/api/tags", async (req, res) => {
    try {
      const tags = await storage.getAllTags();
      res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  app.get("/api/tags/:id", async (req, res) => {
    try {
      const tag = await storage.getTag(req.params.id);
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      res.json(tag);
    } catch (error) {
      console.error("Error fetching tag:", error);
      res.status(500).json({ message: "Failed to fetch tag" });
    }
  });

  app.post("/api/admin/tags", requirePermission("tag:manage"), async (req, res) => {
    try {
      const parseResult = insertTagSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          message: "Invalid tag data",
          errors: parseResult.error.errors
        });
      }

      const tag = await storage.createTag(parseResult.data);
      res.status(201).json(tag);
    } catch (error) {
      console.error("Error creating tag:", error);
      res.status(500).json({ message: "Failed to create tag" });
    }
  });

  app.put("/api/admin/tags/:id", requirePermission("tag:manage"), async (req, res) => {
    try {
      const parseResult = insertTagSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          message: "Invalid tag data",
          errors: parseResult.error.errors
        });
      }

      const tag = await storage.updateTag(req.params.id, parseResult.data);
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      res.json(tag);
    } catch (error) {
      console.error("Error updating tag:", error);
      res.status(500).json({ message: "Failed to update tag" });
    }
  });

  app.delete("/api/admin/tags/:id", requirePermission("tag:manage"), async (req, res) => {
    try {
      await storage.deleteTag(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tag:", error);
      res.status(500).json({ message: "Failed to delete tag" });
    }
  });

  // Product Images routes
  app.get("/api/products/:id/images", async (req, res) => {
    try {
      const images = await storage.getProductImages(req.params.id);
      res.json(images);
    } catch (error) {
      console.error("Error fetching product images:", error);
      res.status(500).json({ message: "Failed to fetch product images" });
    }
  });

  app.post("/api/admin/products/:id/images", requirePermission("product:update"), async (req, res) => {
    try {
      const parseResult = insertProductImageSchema.safeParse({
        ...req.body,
        productId: req.params.id
      });
      if (!parseResult.success) {
        return res.status(400).json({
          message: "Invalid image data",
          errors: parseResult.error.errors
        });
      }

      const image = await storage.addProductImage(parseResult.data);
      res.status(201).json(image);
    } catch (error) {
      console.error("Error adding product image:", error);
      res.status(500).json({ message: "Failed to add product image" });
    }
  });

  app.put("/api/admin/products/:productId/images/:imageId", requirePermission("product:update"), async (req, res) => {
    try {
      const parseResult = insertProductImageSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          message: "Invalid image data",
          errors: parseResult.error.errors
        });
      }

      const image = await storage.updateProductImage(req.params.imageId, parseResult.data);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json(image);
    } catch (error) {
      console.error("Error updating product image:", error);
      res.status(500).json({ message: "Failed to update product image" });
    }
  });

  app.delete("/api/admin/products/:productId/images/:imageId", requirePermission("product:update"), async (req, res) => {
    try {
      await storage.deleteProductImage(req.params.imageId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product image:", error);
      res.status(500).json({ message: "Failed to delete product image" });
    }
  });

  app.put("/api/admin/products/:productId/images/:imageId/primary", requirePermission("product:update"), async (req, res) => {
    try {
      await storage.setPrimaryImage(req.params.productId, req.params.imageId);
      res.status(204).send();
    } catch (error) {
      console.error("Error setting primary image:", error);
      res.status(500).json({ message: "Failed to set primary image" });
    }
  });

  app.put("/api/admin/products/:productId/images/reorder", requirePermission("product:update"), async (req, res) => {
    try {
      const { imageOrders } = req.body;
      if (!Array.isArray(imageOrders)) {
        return res.status(400).json({ message: "imageOrders must be an array" });
      }

      await storage.reorderProductImages(req.params.productId, imageOrders);
      res.status(204).send();
    } catch (error) {
      console.error("Error reordering product images:", error);
      res.status(500).json({ message: "Failed to reorder product images" });
    }
  });

  // Product Tags routes
  app.get("/api/products/:id/tags", async (req, res) => {
    try {
      const tags = await storage.getProductTags(req.params.id);
      res.json(tags);
    } catch (error) {
      console.error("Error fetching product tags:", error);
      res.status(500).json({ message: "Failed to fetch product tags" });
    }
  });

  app.post("/api/admin/products/:productId/tags/:tagId", requirePermission("product:update"), async (req, res) => {
    try {
      await storage.addProductTag(req.params.productId, req.params.tagId);
      res.status(204).send();
    } catch (error) {
      console.error("Error adding product tag:", error);
      res.status(500).json({ message: "Failed to add product tag" });
    }
  });

  app.delete("/api/admin/products/:productId/tags/:tagId", requirePermission("product:update"), async (req, res) => {
    try {
      await storage.removeProductTag(req.params.productId, req.params.tagId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing product tag:", error);
      res.status(500).json({ message: "Failed to remove product tag" });
    }
  });

  app.put("/api/admin/products/:productId/tags", requirePermission("product:update"), async (req, res) => {
    try {
      const { tagIds } = req.body;
      if (!Array.isArray(tagIds)) {
        return res.status(400).json({ message: "tagIds must be an array" });
      }

      await storage.setProductTags(req.params.productId, tagIds);
      res.status(204).send();
    } catch (error) {
      console.error("Error setting product tags:", error);
      res.status(500).json({ message: "Failed to set product tags" });
    }
  });

  // Stock Management routes
  app.get("/api/admin/stock/alerts", requirePermission("stock:read"), async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const alerts = await storage.getStockAlerts(limit);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching stock alerts:", error);
      res.status(500).json({ message: "Failed to fetch stock alerts" });
    }
  });

  app.get("/api/admin/stock/summary", requirePermission("stock:read"), async (req, res) => {
    try {
      const summary = await storage.getStockSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error fetching stock summary:", error);
      res.status(500).json({ message: "Failed to fetch stock summary" });
    }
  });

  app.get("/api/admin/products/:id/stock", requirePermission("stock:read"), async (req, res) => {
    try {
      const stock = await storage.getProductStock(req.params.id);
      res.json(stock);
    } catch (error) {
      console.error("Error fetching product stock:", error);
      res.status(500).json({ message: "Failed to fetch product stock" });
    }
  });

  app.put("/api/admin/products/:id/stock", requirePermission("stock:adjust"), async (req, res) => {
    try {
      const { quantidade, location } = req.body;
      if (typeof quantidade !== 'number' || quantidade < 0) {
        return res.status(400).json({ message: "Invalid quantity" });
      }

      await storage.updateProductStock(req.params.id, quantidade, location);
      res.status(204).send();
    } catch (error) {
      console.error("Error updating product stock:", error);
      res.status(500).json({ message: "Failed to update product stock" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
