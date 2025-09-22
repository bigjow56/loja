import { db } from "./db";
import { products } from "@shared/schema";
import { sql } from "drizzle-orm";

export const seedProducts = async () => {
  try {
    // Check if products already exist
    const existingProducts = await db.select().from(products);
    const productCount = existingProducts.length;
    
    if (productCount > 0) {
      console.log(`Database already has ${productCount} products, skipping seed`);
      return;
    }

    console.log("Seeding database with initial products...");
    
    const seedProducts = [
      {
        nome: "iPhone 15 Pro",
        descricao: "Smartphone Apple iPhone 15 Pro com chip A17 Pro, câmera de 48MP e tela de 6.1 polegadas",
        preco: "8999.00",
        precoAnterior: "9999.00",
        imageUrl: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500&h=500&fit=crop",
        categoria: "Smartphones",
        marca: "Apple",
        avaliacao: "4.8",
        totalAvaliacoes: 1250,
        vendas: 850,
        desconto: 10,
        isFeatured: true,
        estoque: 25
      },
      {
        nome: "Samsung Galaxy S24 Ultra",
        descricao: "Smartphone Samsung Galaxy S24 Ultra com S Pen, câmera de 200MP e tela de 6.8 polegadas",
        preco: "7999.00",
        precoAnterior: "8999.00",
        imageUrl: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&h=500&fit=crop",
        categoria: "Smartphones",
        marca: "Samsung",
        avaliacao: "4.7",
        totalAvaliacoes: 980,
        vendas: 650,
        desconto: 11,
        isFeatured: true,
        estoque: 18
      },
      {
        nome: "MacBook Air M3",
        descricao: "Notebook Apple MacBook Air 13 polegadas com chip M3, 8GB RAM e 256GB SSD",
        preco: "12999.00",
        precoAnterior: "14999.00",
        imageUrl: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=500&h=500&fit=crop",
        categoria: "Laptops",
        marca: "Apple",
        avaliacao: "4.9",
        totalAvaliacoes: 750,
        vendas: 420,
        desconto: 13,
        isFeatured: true,
        estoque: 12
      },
      {
        nome: "Dell XPS 13",
        descricao: "Notebook Dell XPS 13 com processador Intel Core i7, 16GB RAM e 512GB SSD",
        preco: "8999.00",
        precoAnterior: "10999.00",
        imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop",
        categoria: "Laptops",
        marca: "Dell",
        avaliacao: "4.6",
        totalAvaliacoes: 620,
        vendas: 380,
        desconto: 18,
        isFeatured: false,
        estoque: 8
      },
      {
        nome: "iPad Pro 12.9",
        descricao: "Tablet Apple iPad Pro 12.9 polegadas com chip M2, 128GB e suporte a Apple Pencil",
        preco: "6999.00",
        precoAnterior: "7999.00",
        imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop",
        categoria: "Tablets",
        marca: "Apple",
        avaliacao: "4.8",
        totalAvaliacoes: 540,
        vendas: 320,
        desconto: 12,
        isFeatured: true,
        estoque: 15
      },
      {
        nome: "Samsung Galaxy Tab S9",
        descricao: "Tablet Samsung Galaxy Tab S9 com tela de 11 polegadas, S Pen inclusa e 128GB",
        preco: "4999.00",
        precoAnterior: "5999.00",
        imageUrl: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=500&h=500&fit=crop",
        categoria: "Tablets",
        marca: "Samsung",
        avaliacao: "4.5",
        totalAvaliacoes: 380,
        vendas: 240,
        desconto: 17,
        isFeatured: false,
        estoque: 22
      },
      {
        nome: "AirPods Pro 2",
        descricao: "Fones de ouvido Apple AirPods Pro com cancelamento ativo de ruído e case MagSafe",
        preco: "1799.00",
        precoAnterior: "2199.00",
        imageUrl: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=500&h=500&fit=crop",
        categoria: "Áudio",
        marca: "Apple",
        avaliacao: "4.7",
        totalAvaliacoes: 1850,
        vendas: 1200,
        desconto: 18,
        isFeatured: true,
        estoque: 45
      },
      {
        nome: "Sony WH-1000XM5",
        descricao: "Fones de ouvido over-ear Sony com cancelamento de ruído premium e 30h de bateria",
        preco: "1999.00",
        precoAnterior: "2499.00",
        imageUrl: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&h=500&fit=crop",
        categoria: "Áudio",
        marca: "Sony",
        avaliacao: "4.6",
        totalAvaliacoes: 920,
        vendas: 680,
        desconto: 20,
        isFeatured: true,
        estoque: 35
      },
      {
        nome: "Nintendo Switch OLED",
        descricao: "Console Nintendo Switch modelo OLED com tela de 7 polegadas e 64GB de armazenamento",
        preco: "2299.00",
        precoAnterior: "2599.00",
        imageUrl: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&h=500&fit=crop",
        categoria: "Games",
        marca: "Nintendo",
        avaliacao: "4.8",
        totalAvaliacoes: 2100,
        vendas: 1550,
        desconto: 12,
        isFeatured: true,
        estoque: 28
      },
      {
        nome: "PlayStation 5",
        descricao: "Console Sony PlayStation 5 com SSD de 825GB e suporte a jogos 4K/120fps",
        preco: "4599.00",
        precoAnterior: "4999.00",
        imageUrl: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&h=500&fit=crop",
        categoria: "Games",
        marca: "Sony",
        avaliacao: "4.9",
        totalAvaliacoes: 1680,
        vendas: 890,
        desconto: 8,
        isFeatured: true,
        estoque: 6
      },
      {
        nome: "Apple Watch Series 9",
        descricao: "Smartwatch Apple Watch Series 9 GPS de 45mm com pulseira esportiva",
        preco: "3299.00",
        precoAnterior: "3799.00",
        imageUrl: "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=500&h=500&fit=crop",
        categoria: "Wearables",
        marca: "Apple",
        avaliacao: "4.7",
        totalAvaliacoes: 1120,
        vendas: 720,
        desconto: 13,
        isFeatured: false,
        estoque: 19
      },
      {
        nome: "Samsung Galaxy Watch 6",
        descricao: "Smartwatch Samsung Galaxy Watch 6 Classic de 47mm com GPS e monitoramento de saúde",
        preco: "2199.00",
        precoAnterior: "2699.00",
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop",
        categoria: "Wearables",
        marca: "Samsung",
        avaliacao: "4.5",
        totalAvaliacoes: 640,
        vendas: 410,
        desconto: 19,
        isFeatured: false,
        estoque: 31
      }
    ];

    await db.insert(products).values(seedProducts);
    console.log(`Successfully seeded ${seedProducts.length} products!`);
    
  } catch (error) {
    console.error("Error seeding products:", error);
    throw error;
  }
};