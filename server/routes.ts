import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertCartItemSchema, insertOrderSchema } from "@shared/schema";
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

  const httpServer = createServer(app);
  return httpServer;
}
