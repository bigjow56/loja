import { sql } from "drizzle-orm";
import { pgTable, varchar, text, decimal, integer, timestamp, uuid, boolean, uniqueIndex, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("user"), // user, admin, super_admin
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories table - hierarchical structure for better organization
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: varchar("nome", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  descricao: text("descricao"),
  parentId: uuid("parent_id").references((): any => categories.id),
  imagemUrl: text("imagem_url"),
  isActive: boolean("is_active").notNull().default(true),
  ordem: integer("ordem").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  slugIndex: uniqueIndex("categories_slug_idx").on(table.slug),
  parentIndex: index("categories_parent_idx").on(table.parentId),
  activeIndex: index("categories_active_idx").on(table.isActive),
}));

// Tags table for flexible product labeling (promoção, lançamento, desconto)
export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: varchar("nome", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  cor: varchar("cor", { length: 7 }).default("#3B82F6"), // hex color for UI
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  slugIndex: uniqueIndex("tags_slug_idx").on(table.slug),
  activeIndex: index("tags_active_idx").on(table.isActive),
}));

export const products = pgTable("products", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: varchar("nome", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  descricao: text("descricao").notNull(),
  descricaoRica: text("descricao_rica"), // Rich text/HTML description for WYSIWYG editor
  sku: varchar("sku", { length: 100 }).unique(),
  preco: decimal("preco", { precision: 10, scale: 2 }).notNull(),
  precoPromocional: decimal("preco_promocional", { precision: 10, scale: 2 }),
  precoAnterior: decimal("preco_anterior", { precision: 10, scale: 2 }),
  categoryId: uuid("category_id").references(() => categories.id),
  marca: varchar("marca", { length: 100 }).notNull(),
  avaliacao: decimal("avaliacao", { precision: 2, scale: 1 }).notNull().default("5.0"),
  totalAvaliacoes: integer("total_avaliacoes").notNull().default(0),
  vendas: integer("vendas").notNull().default(0),
  desconto: integer("desconto").default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  status: varchar("status", { length: 20 }).notNull().default("rascunho"), // rascunho, publicado, inativo
  peso: decimal("peso", { precision: 8, scale: 3 }), // in kg
  dimensoes: text("dimensoes"), // JSON: {comprimento, largura, altura}
  estoqueMinimo: integer("estoque_minimo").default(5),
  permitirVendaSemEstoque: boolean("permitir_venda_sem_estoque").default(false),
  // Legacy fields for backward compatibility
  imageUrl: text("image_url").notNull(),
  categoria: varchar("categoria", { length: 100 }).notNull(),
  estoque: integer("estoque").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  slugIndex: uniqueIndex("products_slug_idx").on(table.slug),
  skuIndex: uniqueIndex("products_sku_idx").on(table.sku),
  categoryIndex: index("products_category_idx").on(table.categoryId),
  marcaIndex: index("products_marca_idx").on(table.marca),
  precoIndex: index("products_preco_idx").on(table.preco),
  avaliacaoIndex: index("products_avaliacao_idx").on(table.avaliacao),
  featuredIndex: index("products_featured_idx").on(table.isFeatured),
  statusIndex: index("products_status_idx").on(table.status),
  vendasIndex: index("products_vendas_idx").on(table.vendas),
}));

export const cartItems = pgTable("cart_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantidade: integer("quantidade").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 50 }).notNull().default("PROCESSANDO"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id),
  quantidade: integer("quantidade").notNull(),
  preco: decimal("preco", { precision: 10, scale: 2 }).notNull(),
});

// Product images table - multiple images per product
export const productImages = pgTable("product_images", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  altText: varchar("alt_text", { length: 255 }),
  ordem: integer("ordem").default(0),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  productIndex: index("product_images_product_idx").on(table.productId),
  ordemIndex: index("product_images_ordem_idx").on(table.ordem),
  primaryIndex: index("product_images_primary_idx").on(table.isPrimary),
}));

// Product variations table - sizes, colors, etc.
export const productVariations = pgTable("product_variations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  nome: varchar("nome", { length: 100 }).notNull(), // e.g., "Tamanho", "Cor"
  valor: varchar("valor", { length: 100 }).notNull(), // e.g., "M", "Azul"
  precoAdicional: decimal("preco_adicional", { precision: 10, scale: 2 }).default("0.00"),
  sku: varchar("sku", { length: 100 }),
  estoque: integer("estoque").notNull().default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  productIndex: index("product_variations_product_idx").on(table.productId),
  skuIndex: index("product_variations_sku_idx").on(table.sku),
  activeIndex: index("product_variations_active_idx").on(table.isActive),
}));

// Product stock table - scalable stock control (separate table as suggested)
export const productStock = pgTable("product_stock", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }),
  variationId: uuid("variation_id").references(() => productVariations.id, { onDelete: "cascade" }),
  quantidade: integer("quantidade").notNull().default(0),
  quantidadeReservada: integer("quantidade_reservada").default(0),
  localizacao: varchar("localizacao", { length: 100 }), // warehouse location
  lote: varchar("lote", { length: 100 }),
  dataValidade: timestamp("data_validade"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  productIndex: index("product_stock_product_idx").on(table.productId),
  variationIndex: index("product_stock_variation_idx").on(table.variationId),
  localizacaoIndex: index("product_stock_localizacao_idx").on(table.localizacao),
  validadeIndex: index("product_stock_validade_idx").on(table.dataValidade),
}));

// Price history table for tracking price changes (for reports)
export const priceHistory = pgTable("price_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  precoAnterior: decimal("preco_anterior", { precision: 10, scale: 2 }),
  precoNovo: decimal("preco_novo", { precision: 10, scale: 2 }).notNull(),
  motivo: varchar("motivo", { length: 255 }), // "Promoção Black Friday", "Ajuste de mercado", etc.
  userId: uuid("user_id").references(() => users.id), // who made the change
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  productIndex: index("price_history_product_idx").on(table.productId),
  createdAtIndex: index("price_history_created_at_idx").on(table.createdAt),
  userIndex: index("price_history_user_idx").on(table.userId),
}));

// Product tags junction table - N:N relationship (promoção, lançamento, desconto)
export const productTags = pgTable("product_tags", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueProductTag: uniqueIndex("product_tags_unique").on(table.productId, table.tagId),
  productIndex: index("product_tags_product_idx").on(table.productId),
  tagIndex: index("product_tags_tag_idx").on(table.tagId),
}));

export const favorites = pgTable("favorites", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserProduct: uniqueIndex("favorites_user_product_unique").on(table.userId, table.productId),
  userIdIndex: index("favorites_user_id_idx").on(table.userId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  cartItems: many(cartItems),
  orders: many(orders),
  favorites: many(favorites),
  priceHistory: many(priceHistory),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
  products: many(products),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  productTags: many(productTags),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
  favorites: many(favorites),
  images: many(productImages),
  variations: many(productVariations),
  stock: many(productStock),
  priceHistory: many(priceHistory),
  productTags: many(productTags),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const productVariationsRelations = relations(productVariations, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariations.productId],
    references: [products.id],
  }),
  stock: many(productStock),
}));

export const productStockRelations = relations(productStock, ({ one }) => ({
  product: one(products, {
    fields: [productStock.productId],
    references: [products.id],
  }),
  variation: one(productVariations, {
    fields: [productStock.variationId],
    references: [productVariations.id],
  }),
}));

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  product: one(products, {
    fields: [priceHistory.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [priceHistory.userId],
    references: [users.id],
  }),
}));

export const productTagsRelations = relations(productTags, ({ one }) => ({
  product: one(products, {
    fields: [productTags.productId],
    references: [products.id],
  }),
  tag: one(tags, {
    fields: [productTags.tagId],
    references: [tags.id],
  }),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  orderItems: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [favorites.productId],
    references: [products.id],
  }),
}));

// Schemas for validation with robust business rules
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Email inválido"),
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(255, "Nome muito longo"),
  role: z.enum(["user", "admin", "super_admin"]).default("user"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories, {
  nome: z.string().min(1, "Nome da categoria é obrigatório").max(255, "Nome muito longo"),
  slug: z.string().min(1, "Slug é obrigatório").max(255, "Slug muito longo"),
  descricao: z.string().max(1000, "Descrição muito longa").optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTagSchema = createInsertSchema(tags, {
  nome: z.string().min(1, "Nome da tag é obrigatório").max(100, "Nome muito longo"),
  slug: z.string().min(1, "Slug é obrigatório").max(100, "Slug muito longo"),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve ser um código hex válido (ex: #3B82F6)").default("#3B82F6"),
}).omit({
  id: true,
  createdAt: true,
});

// Product validation with business rules: nome obrigatório, preço > 0, estoque >= 0
export const insertProductSchema = createInsertSchema(products, {
  nome: z.string().min(1, "Nome do produto é obrigatório").max(255, "Nome muito longo"),
  slug: z.string().min(1, "Slug é obrigatório").max(255, "Slug muito longo"),
  descricao: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  sku: z.string().max(100, "SKU muito longo").optional(),
  preco: z.string().refine((val) => parseFloat(val) > 0, "Preço deve ser maior que zero"),
  precoPromocional: z.string().refine((val) => val === "" || parseFloat(val) > 0, "Preço promocional deve ser maior que zero").optional(),
  marca: z.string().min(1, "Marca é obrigatória").max(100, "Nome da marca muito longo"),
  estoque: z.number().min(0, "Estoque não pode ser negativo"),
  estoqueMinimo: z.number().min(0, "Estoque mínimo não pode ser negativo").default(5),
  status: z.enum(["rascunho", "publicado", "inativo"]).default("rascunho"),
  peso: z.string().refine((val) => val === "" || parseFloat(val) > 0, "Peso deve ser positivo").optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductImageSchema = createInsertSchema(productImages, {
  url: z.string().url("URL da imagem inválida"),
  altText: z.string().max(255, "Texto alternativo muito longo").optional(),
  ordem: z.number().min(0, "Ordem deve ser positiva").default(0),
}).omit({
  id: true,
  createdAt: true,
});

export const insertProductVariationSchema = createInsertSchema(productVariations, {
  nome: z.string().min(1, "Nome da variação é obrigatório").max(100, "Nome muito longo"),
  valor: z.string().min(1, "Valor da variação é obrigatório").max(100, "Valor muito longo"),
  precoAdicional: z.string().refine((val) => parseFloat(val) >= 0, "Preço adicional não pode ser negativo").default("0.00"),
  sku: z.string().max(100, "SKU muito longo").optional(),
  estoque: z.number().min(0, "Estoque não pode ser negativo").default(0),
}).omit({
  id: true,
  createdAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems, {
  quantidade: z.number().min(1, "Quantidade deve ser pelo menos 1"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type ProductImage = typeof productImages.$inferSelect;
export type InsertProductImage = z.infer<typeof insertProductImageSchema>;

export type ProductVariation = typeof productVariations.$inferSelect;
export type InsertProductVariation = z.infer<typeof insertProductVariationSchema>;

export type ProductStock = typeof productStock.$inferSelect;
export type PriceHistory = typeof priceHistory.$inferSelect;
export type ProductTag = typeof productTags.$inferSelect;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;

// Extended types for API responses
export type CartItemWithProduct = CartItem & {
  product: Product;
};

export type OrderWithItems = Order & {
  orderItems: (OrderItem & { product: Product })[];
};

export type ProductWithFavorite = Product & {
  isFavorited?: boolean;
};

export type ProductWithDetails = Product & {
  category?: Category;
  images: ProductImage[];
  variations: ProductVariation[];
  tags: Tag[];
  currentStock: number;
  isFavorited?: boolean;
};

export type CategoryWithChildren = Category & {
  children: Category[];
  parent?: Category;
  productCount?: number;
};

export type ProductWithStock = Product & {
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  isLowStock: boolean;
};

// Stock alert type for admin notifications
export type StockAlert = {
  productId: string;
  productName: string;
  currentStock: number;
  minimumStock: number;
  variationName?: string;
};
