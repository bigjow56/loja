import {
  users,
  products,
  cartItems,
  orders,
  orderItems,
  categories,
  tags,
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type CartItem,
  type InsertCartItem,
  type CartItemWithProduct,
  type Order,
  type InsertOrder,
  type OrderWithItems,
  type OrderItem,
  type Category,
  type Tag,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ne, desc, asc, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Product operations
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;
  
  // Category operations
  getAllCategories(): Promise<Category[]>;
  
  // Tag operations
  getAllTags(): Promise<Tag[]>;
  
  // Admin operations
  getDashboardStats(): Promise<{
    totalProducts: number;
    totalUsers: number;
    totalOrders: number;
    lowStockProducts: number;
    recentProducts: Product[];
    stockAlerts: Array<{
      productId: string;
      productName: string;
      currentStock: number;
      minimumStock: number | null;
    }>;
  }>;
  
  // Product recommendations
  getRelatedProducts(productId: string, limit?: number): Promise<Product[]>;
  getBestsellingProducts(limit?: number): Promise<Product[]>;
  getFeaturedProducts(limit?: number): Promise<Product[]>;

  // Cart operations
  getCartItems(userId: string): Promise<CartItemWithProduct[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(id: string, quantidade: number): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<void>;
  clearCart(userId: string): Promise<void>;

  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  addOrderItem(orderItem: Omit<OrderItem, "id">): Promise<OrderItem>;
  getOrdersByUser(userId: string): Promise<OrderWithItems[]>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // In our case, username is the email
    return this.getUserByEmail(username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getAllTags(): Promise<Tag[]> {
    return await db.select().from(tags);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: string, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getDashboardStats() {
    // Get total counts
    const [totalProductsResult] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(products);
    
    const [totalUsersResult] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(users);
    
    const [totalOrdersResult] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(orders);

    // Get products with low stock
    const [lowStockResult] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(products)
      .where(sql`${products.estoque} <= ${products.estoqueMinimo}`);

    // Get recent products (last 5)
    const recentProducts = await db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt))
      .limit(5);

    // Get stock alerts (products with low stock)
    const stockAlerts = await db
      .select({
        productId: products.id,
        productName: products.nome,
        currentStock: products.estoque,
        minimumStock: products.estoqueMinimo,
      })
      .from(products)
      .where(sql`${products.estoque} <= ${products.estoqueMinimo}`)
      .limit(10);

    return {
      totalProducts: totalProductsResult.count || 0,
      totalUsers: totalUsersResult.count || 0,
      totalOrders: totalOrdersResult.count || 0,
      lowStockProducts: lowStockResult.count || 0,
      recentProducts,
      stockAlerts,
    };
  }

  // Product recommendations
  async getRelatedProducts(productId: string, limit: number = 6): Promise<Product[]> {
    // First, get the current product to understand its category and brand
    const currentProduct = await this.getProduct(productId);
    if (!currentProduct) return [];

    // Priority algorithm:
    // 1. Same category + same brand (highest priority)
    // 2. Same category + different brand
    // 3. Different category + same brand (if needed to fill quota)
    
    const relatedProducts = await db
      .select()
      .from(products)
      .where(
        and(
          ne(products.id, productId), // Exclude current product
          eq(products.categoria, currentProduct.categoria) // Same category
        )
      )
      .orderBy(
        // Order by rating first, then by sales - brand priority will be handled by separate query if needed
        desc(products.avaliacao),
        desc(products.vendas)
      )
      .limit(limit);

    return relatedProducts;
  }

  async getBestsellingProducts(limit: number = 6): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .orderBy(desc(products.vendas), desc(products.avaliacao))
      .limit(limit);
  }

  async getFeaturedProducts(limit: number = 6): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.isFeatured, true))
      .orderBy(desc(products.vendas), desc(products.avaliacao))
      .limit(limit);
  }

  // Cart operations
  async getCartItems(userId: string): Promise<CartItemWithProduct[]> {
    return await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        productId: cartItems.productId,
        quantidade: cartItems.quantidade,
        createdAt: cartItems.createdAt,
        updatedAt: cartItems.updatedAt,
        product: products,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));
  }

  async addToCart(cartItemData: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, cartItemData.userId),
          eq(cartItems.productId, cartItemData.productId)
        )
      );

    if (existingItem) {
      // Update quantity if item exists
      const [updatedItem] = await db
        .update(cartItems)
        .set({ 
          quantidade: existingItem.quantidade + (cartItemData.quantidade || 1),
          updatedAt: new Date()
        })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Create new cart item
      const [newItem] = await db.insert(cartItems).values(cartItemData).returning();
      return newItem;
    }
  }

  async updateCartItemQuantity(id: string, quantidade: number): Promise<CartItem | undefined> {
    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantidade, updatedAt: new Date() })
      .where(eq(cartItems.id, id))
      .returning();
    return updatedItem;
  }

  async removeFromCart(id: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  // Order operations
  async createOrder(orderData: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(orderData).returning();
    return order;
  }

  async addOrderItem(orderItemData: Omit<OrderItem, "id">): Promise<OrderItem> {
    const [orderItem] = await db.insert(orderItems).values(orderItemData).returning();
    return orderItem;
  }

  async getOrdersByUser(userId: string): Promise<OrderWithItems[]> {
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId));

    const ordersWithItems = await Promise.all(
      userOrders.map(async (order) => {
        const items = await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productId: orderItems.productId,
            quantidade: orderItems.quantidade,
            preco: orderItems.preco,
            product: products,
          })
          .from(orderItems)
          .innerJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          orderItems: items,
        };
      })
    );

    return ordersWithItems;
  }
}

export const storage = new DatabaseStorage();
