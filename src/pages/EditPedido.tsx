import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import type { PedidoFormData } from '../types/Pedido';
import { ROUTES } from '../config/routes';
import { PEDIDO_MESSAGES } from '../constants/messages';
import { getPedidoById, updatePedido } from '../services/pedidoService';
import MainLayout from '../layouts/MainLayout';
import PedidoForm from '../components/pedidos/PedidoForm';
import './EditPedido.scss';

const EditPedido = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [initialData, setInitialData] = useState<PedidoFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPedido = async () => {
      if (!id) return;

      try {
        const pedido = await getPedidoById(id);
        if (pedido) {
          setInitialData({
            clienteNombre: pedido.clienteNombre,
            clienteTelefono: pedido.clienteTelefono,
            productos: pedido.productos,
            total: pedido.total,
            notas: pedido.notas || ''
          });
        } else {
          setError('Pedido no encontrado');
        }
      } catch {
        setError('Error al cargar el pedido');
      } finally {
        setLoading(false);
      }
    };

    fetchPedido();
  }, [id]);

  const handleSubmit = async (data: PedidoFormData) => {
    if (!id) return;

    setSaving(true);
    setError('');

    try {
      await updatePedido(id, data);
      showToast('Pedido actualizado correctamente', 'success');
      navigate(ROUTES.DASHBOARD);
    } catch {
      setError(PEDIDO_MESSAGES.UPDATE_ERROR);
      showToast(PEDIDO_MESSAGES.UPDATE_ERROR, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="edit-pedido">
        <div className="edit-pedido__header">
          <h1>Editar Pedido</h1>
        </div>

        {error && <div className="edit-pedido__error">{error}</div>}

        {loading && <p className="edit-pedido__loading">Cargando pedido...</p>}

        {!loading && initialData && (
          <div className="edit-pedido__form">
            <PedidoForm
              onSubmit={handleSubmit}
              loading={saving}
              initialData={initialData}
              submitText="Guardar cambios"
            />
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default EditPedido;
