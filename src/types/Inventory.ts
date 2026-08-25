export interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  stock: number;
  minStock: number;
  // Cuánto pedir para llegar al máximo configurado — solo si el producto
  // tiene maxStock definido, si no no hay forma de sugerir una cantidad.
  suggestedRestock?: number;
}

export interface InventoryStats {
  totalTracked: number;
  totalValue: number;
  outOfStock: InventoryItem[];
  lowStock: InventoryItem[];
}
