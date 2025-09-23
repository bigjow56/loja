import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAnyAdminRole, requirePermission, requireAnyPermission } from "./auth";
import { insertCartItemSchema, insertOrderSchema, insertProductSchema, insertCategorySchema } from "@shared/schema";
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

      const category = await storage.createCategory(parseResult.data);
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

  app.post("/api/admin/tags", requirePermission("tag:manage"), async (req, res) => {
    try {
      // Implement tag creation
      res.status(501).json({ message: "Tag creation not implemented yet" });
    } catch (error) {
      console.error("Error creating tag:", error);
      res.status(500).json({ message: "Failed to create tag" });
    }
  });

  app.put("/api/admin/tags/:id", requirePermission("tag:manage"), async (req, res) => {
    try {
      // Implement tag update
      res.status(501).json({ message: "Tag update not implemented yet" });
    } catch (error) {
      console.error("Error updating tag:", error);
      res.status(500).json({ message: "Failed to update tag" });
    }
  });

  app.delete("/api/admin/tags/:id", requirePermission("tag:manage"), async (req, res) => {
    try {
      // Implement tag deletion
      res.status(501).json({ message: "Tag deletion not implemented yet" });
    } catch (error) {
      console.error("Error deleting tag:", error);
      res.status(500).json({ message: "Failed to delete tag" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
