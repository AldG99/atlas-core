import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useOrders } from '../hooks/useOrders';
import { useToast } from '../hooks/useToast';
import type { OrderFormData, OrderItem } from '../types/Order';
import type { Client } from '../types/Client';
import { PiShoppingBagBold } from 'react-icons/pi';
import { ROUTES } from '../config/routes';
import MainLayout from '../layouts/MainLayout';
import OrderForm from '../components/orders/OrderForm';
import './NewOrder.scss';

interface LocationState {
  client?: Client;
  items?: OrderItem[];
}

const NewOrder = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();
  const { addOrder } = useOrders();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = location.state as LocationState | null;
  const defaultClient = locationState?.client;
  const defaultItems = locationState?.items;

  const handleCancel = () => {
    showToast(t('orders.cancelSuccess'), 'info');
    navigate(-1);
  };

  const handleSubmit = async (data: OrderFormData) => {
    setLoading(true);
    setError('');

    try {
      await addOrder(data);
      showToast(t('orders.createSuccess'), 'success');
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('orders.createError');
      setError(msg);
      showToast(msg, 'error');
      // Se relanza para que OrderForm sepa que falló y no limpie el carrito ya capturado.
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="new-order">
        <div className="new-order__card">
          <div className="new-order__header">
            <h1>{t('dashboard.newOrder')}</h1>
            <PiShoppingBagBold className="new-order__header-icon" size={28} />
          </div>

          {error && <div className="new-order__error">{error}</div>}

          <div className="new-order__form">
            <OrderForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
              defaultClient={defaultClient}
              defaultItems={defaultItems}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default NewOrder;
