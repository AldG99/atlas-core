export type OrderStatus = 'pending' | 'preparing' | 'delivered';

export interface Payment {
  id: string;
  amount: number;
  date: Date;
  itemIndex?: number;
  originalAmount?: number;
  editedAt?: Date;
}

export interface OrderItem {
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
  subtotal: number;
  originalPrice?: number;
  discount?: number;
  productId?: string;
  trackStock?: boolean;
}

export interface Order {
  id: string;
  orderNumber?: string;
  clientName: string;
  clientPhone: string;
  clientPhoto?: string;
  clientPostalCode?: string;
  items: OrderItem[];
  total: number;
  notes?: string;
  status: OrderStatus;
  archived: boolean;
  createdAt: Date;
  deliveredAt?: Date;
  userId: string;
  payments?: Payment[];
}

export interface OrderFormData {
  clientName: string;
  clientPhone: string;
  clientPhoto?: string;
  clientPostalCode?: string;
  items: OrderItem[];
  total: number;
  notes?: string;
}
