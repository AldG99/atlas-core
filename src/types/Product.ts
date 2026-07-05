export interface Label {
  id: string;
  name: string;
  color: string;
  icon: string;
  userId: string;
}

export interface DiscountHistory {
  percentage: number;
  startDate: Date;
  endDate: Date;
  closedAt: Date;
  reason: 'cancelled' | 'expired';
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  labels?: string[];
  discount?: number;
  discountEndDate?: Date;
  discountHistory?: DiscountHistory[];
  trackStock?: boolean;
  stock?: number;
  unit?: string;
  unitQuantity?: number;
  userId: string;
  createdAt: Date;
}

export interface ProductFormData {
  sku: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  labels?: string[];
  discount?: number;
  discountEndDate?: Date | string;
  trackStock?: boolean;
  stock?: number;
  unit?: string;
  unitQuantity?: number;
}
