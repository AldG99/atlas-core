import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePedidos } from '../hooks/usePedidos';
import { useToast } from '../hooks/useToast';
import type { PedidoFormData, ProductoItem } from '../types/Pedido';
import type { Cliente } from '../types/Cliente';
import { ROUTES } from '../config/routes';
import { PEDIDO_MESSAGES } from '../constants/messages';
import MainLayout from '../layouts/MainLayout';
import PedidoForm from '../components/pedidos/PedidoForm';
import './NewPedido.scss';

interface LocationState {
  cliente?: Cliente;
  productos?: ProductoItem[];
}

const NewPedido = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();
  const { addPedido } = usePedidos();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = location.state as LocationState | null;
  const defaultCliente = locationState?.cliente;
  const defaultProductos = locationState?.productos;

  const handleSubmit = async (data: PedidoFormData) => {
    setLoading(true);
    setError('');

    try {
      await addPedido(data);
      showToast(t('orders.createSuccess'), 'success');
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      const msg = err instanceof Error ? err.message : PEDIDO_MESSAGES.CREATE_ERROR;
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
            <h1>{t('orders.newOrder')}</h1>
          </div>

          {error && <div className="new-pedido__error">{error}</div>}

          <div className="new-pedido__form">
            <PedidoForm
              onSubmit={handleSubmit}
              onCancel={() => navigate(-1)}
              loading={loading}
              defaultCliente={defaultCliente}
              defaultProductos={defaultProductos}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default NewPedido;
