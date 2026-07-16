import type { FormEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { OrderFormData, OrderItem } from '../../types/Order';
import type { Product } from '../../types/Product';
import type { Client } from '../../types/Client';
import ProductSelector, { type OrderLineItem } from './ProductSelector';
import ClientSelector from './ClientSelector';
import './OrderForm.scss';

interface OrderFormProps {
  onSubmit: (data: OrderFormData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  submitText?: string;
  defaultClient?: Client;
  defaultItems?: OrderItem[];
}

const OrderForm = ({
  onSubmit,
  onCancel,
  loading = false,
  submitText,
  defaultClient,
  defaultItems
}: OrderFormProps) => {
  const { t } = useTranslation();
  const [selectedClient, setSelectedClient] = useState<Client | null>(defaultClient || null);
  const [items, setItems] = useState<OrderLineItem[]>(() => {
    if (defaultItems && defaultItems.length > 0) {
      return defaultItems.map((p, i) => ({
        product: {
          id: `repeat-${i}`,
          sku: p.sku || '',
          name: p.name,
          price: p.unitPrice,
          userId: '',
          createdAt: new Date()
        } as Product,
        quantity: p.quantity,
        subtotal: p.subtotal
      }));
    }
    return [];
  });
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ client?: string; items?: string }>({});

  const validate = (): boolean => {
    const newErrors: { client?: string; items?: string } = {};

    if (!selectedClient) {
      newErrors.client = t('orders.clientRequired');
    }

    if (items.length === 0) {
      newErrors.items = t('orders.productsRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const orderItems: OrderItem[] = items.map((item) => {
      const effective = getEffectivePrice(item.product);
      const hasDiscount = effective < item.product.price;
      const isRealProduct = !item.product.id.startsWith('repeat-');
      return {
        name: item.product.name,
        sku: item.product.sku || undefined,
        quantity: item.quantity,
        unitPrice: effective,
        subtotal: item.subtotal,
        ...(hasDiscount && {
          originalPrice: item.product.price,
          discount: item.product.discount
        }),
        ...(isRealProduct && item.product.trackStock && {
          productId: item.product.id,
          trackStock: true
        })
      };
    });

    const data: OrderFormData = {
      clientName: selectedClient!.firstName + ' ' + selectedClient!.lastName,
      clientPhone: selectedClient!.phone,
      clientPhoto: selectedClient!.profilePhoto,
      clientPostalCode: selectedClient!.postalCode,
      items: orderItems,
      total,
      notes
    };

    await onSubmit(data);

    setSelectedClient(null);
    setItems([]);
    setNotes('');
  };

  const handleClientSelect = (client: Client | null) => {
    setSelectedClient(client);
    if (errors.client) {
      setErrors((prev) => ({ ...prev, client: undefined }));
    }
  };

  const getEffectivePrice = (p: Product): number => {
    if (p.discount && p.discount > 0 && p.discountEndDate &&
        new Date(p.discountEndDate) >= new Date(new Date().toDateString())) {
      return p.price * (1 - p.discount / 100);
    }
    return p.price;
  };

  const handleAddItem = (product: Product) => {
    const effectivePrice = getEffectivePrice(product);
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
          subtotal: (updated[existingIndex].quantity + 1) * effectivePrice
        };
        return updated;
      }

      return [...prev, { product, quantity: 1, subtotal: effectivePrice }];
    });

    if (errors.items) {
      setErrors((prev) => ({ ...prev, items: undefined }));
    }
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity, subtotal: quantity * getEffectivePrice(item.product) }
          : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  return (
    <form onSubmit={handleSubmit} className="order-form">
      <div className="order-form__fields order-form__fields--client">
        <ClientSelector
          onSelect={handleClientSelect}
          selectedClient={selectedClient}
        />
        {errors.client && (
          <span className="error-message">{errors.client}</span>
        )}
      </div>

      <ProductSelector
        items={items}
        onAddItem={handleAddItem}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        total={total}
        disabled={!selectedClient}
        error={errors.items}
      />

      <div className="order-form__fields">
        <div className="form-group">
          <label htmlFor="notas">{t('orders.notes')}</label>
          <input
            id="notas"
            name="notas"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input"
            placeholder={t('orders.notesPlaceholder')}
            maxLength={80}
            disabled={!selectedClient || items.length === 0}
          />
        </div>

        <div className="order-form__actions">
          {onCancel && (
            <button
              type="button"
              className="btn btn--outline btn--full"
              onClick={onCancel}
              disabled={loading}
            >
              {t('common.cancel')}
            </button>
          )}
          <button
            type="submit"
            className="btn btn--primary btn--full"
            disabled={loading || !selectedClient || items.length === 0}
          >
            {loading ? t('orders.saving') : (submitText ?? t('orders.submitButton'))}
          </button>
        </div>
      </div>
    </form>
  );
};

export default OrderForm;
