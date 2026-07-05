export type OrderStatus = 'pending' | 'preparing' | 'delivered';

export interface CreatedBy {
  uid: string;
  name: string;
}

export interface Payment {
  id: string;
  amount: number;
  date: Date;
  itemIndex?: number;
  originalAmount?: number;
  editedAt?: Date;
  createdBy?: CreatedBy;
}

export interface OrderItem {
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
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
  createdBy?: CreatedBy;
  deliveredBy?: CreatedBy;
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
