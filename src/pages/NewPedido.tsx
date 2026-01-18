import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePedidos } from '../hooks/usePedidos';
import { useToast } from '../hooks/useToast';
import type { PedidoFormData } from '../types/Pedido';
import { ROUTES } from '../config/routes';
import { PEDIDO_MESSAGES } from '../constants/messages';
import MainLayout from '../layouts/MainLayout';
import PedidoForm from '../components/pedidos/PedidoForm';
import './NewPedido.scss';

const NewPedido = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { addPedido } = usePedidos();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (data: PedidoFormData) => {
    setLoading(true);
    setError('');

    try {
      await addPedido(data);
      showToast('Pedido creado correctamente', 'success');
      navigate(ROUTES.DASHBOARD);
    } catch {
      setError(PEDIDO_MESSAGES.CREATE_ERROR);
      showToast(PEDIDO_MESSAGES.CREATE_ERROR, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="new-pedido">
        <div className="new-pedido__header">
          <h1>Nuevo Pedido</h1>
        </div>

        {error && <div className="new-pedido__error">{error}</div>}

        <div className="new-pedido__form">
          <PedidoForm onSubmit={handleSubmit} loading={loading} />
        </div>
      </div>
    </MainLayout>
  );
};

export default NewPedido;
