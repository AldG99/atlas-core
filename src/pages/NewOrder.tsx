import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOrders } from '../hooks/useOrders';
import { useToast } from '../hooks/useToast';
import type { OrderFormData, OrderItem } from '../types/Order';
import type { Client } from '../types/Client';
import { PiShoppingBagBold } from 'react-icons/pi';
import { ROUTES } from '../config/routes';
import { ORDER_MESSAGES } from '../constants/messages';
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

  const handleSubmit = async (data: OrderFormData) => {
    setLoading(true);
    setError('');

    try {
      await addOrder(data);
      showToast(t('orders.createSuccess'), 'success');
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      const msg = err instanceof Error ? err.message : ORDER_MESSAGES.CREATE_ERROR;
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="new-pedido">
        <div className="new-pedido__card">
          <div className="new-pedido__header">
            <h1>{t('dashboard.newOrder')}</h1>
            <PiShoppingBagBold className="new-pedido__header-icon" size={28} />
          </div>

          {error && <div className="new-pedido__error">{error}</div>}

          <div className="new-pedido__form">
            <OrderForm
              onSubmit={handleSubmit}
              onCancel={() => navigate(-1)}
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
