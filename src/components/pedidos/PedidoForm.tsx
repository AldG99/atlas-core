import type { FormEvent } from 'react';
import { useState, useEffect } from 'react';
import type { PedidoFormData, ProductoItem } from '../../types/Pedido';
import type { Producto } from '../../types/Producto';
import type { Cliente } from '../../types/Cliente';
import ProductoSelector, { type ItemPedido } from './ProductoSelector';
import ClienteSelector from './ClienteSelector';
import './PedidoForm.scss';

interface PedidoFormProps {
  onSubmit: (data: PedidoFormData) => Promise<void>;
  loading?: boolean;
  initialData?: PedidoFormData;
  submitText?: string;
}

const PedidoForm = ({
  onSubmit,
  loading = false,
  initialData,
  submitText = 'Crear pedido'
}: PedidoFormProps) => {
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [items, setItems] = useState<ItemPedido[]>([]);
  const [total, setTotal] = useState(0);
  const [notas, setNotas] = useState('');
  const [errors, setErrors] = useState<{ cliente?: string; productos?: string }>({});

  useEffect(() => {
    if (initialData) {
      setNotas(initialData.notas || '');
      setTotal(initialData.total);
    }
  }, [initialData]);

  useEffect(() => {
    const newTotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    setTotal(newTotal);
  }, [items]);

  const validate = (): boolean => {
    const newErrors: { cliente?: string; productos?: string } = {};

    if (!selectedCliente) {
      newErrors.cliente = 'Selecciona un cliente';
    }

    if (items.length === 0) {
      newErrors.productos = 'Agrega al menos un producto';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const productos: ProductoItem[] = items.map((item) => ({
      nombre: item.producto.nombre,
      clave: item.producto.clave || undefined,
      cantidad: item.cantidad,
      precioUnitario: item.producto.precio,
      subtotal: item.subtotal
    }));

    const data: PedidoFormData = {
      clienteNombre: selectedCliente!.nombre + ' ' + selectedCliente!.apellido,
      clienteTelefono: selectedCliente!.telefono,
      clienteFoto: selectedCliente!.fotoPerfil,
      clienteCodigoPostal: selectedCliente!.codigoPostal,
      productos,
      total,
      notas
    };

    await onSubmit(data);

    if (!initialData) {
      setSelectedCliente(null);
      setItems([]);
      setTotal(0);
      setNotas('');
    }
  };

  const handleClienteSelect = (cliente: Cliente | null) => {
    setSelectedCliente(cliente);
    if (errors.cliente) {
      setErrors((prev) => ({ ...prev, cliente: undefined }));
    }
  };

  const handleAddItem = (producto: Producto) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.producto.id === producto.id);

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          cantidad: updated[existingIndex].cantidad + 1,
          subtotal: (updated[existingIndex].cantidad + 1) * producto.precio
        };
        return updated;
      }

      return [...prev, { producto, cantidad: 1, subtotal: producto.precio }];
    });

    if (errors.productos) {
      setErrors((prev) => ({ ...prev, productos: undefined }));
    }
  };

  const handleUpdateCantidad = (productoId: string, cantidad: number) => {
    if (cantidad <= 0) {
      handleRemoveItem(productoId);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.producto.id === productoId
          ? { ...item, cantidad, subtotal: cantidad * item.producto.precio }
          : item
      )
    );
  };

  const handleRemoveItem = (productoId: string) => {
    setItems((prev) => prev.filter((item) => item.producto.id !== productoId));
  };

  return (
    <form onSubmit={handleSubmit} className="pedido-form">
      <ClienteSelector
        onSelect={handleClienteSelect}
        selectedCliente={selectedCliente}
      />
      {errors.cliente && (
        <span className="error-message">{errors.cliente}</span>
      )}

      <ProductoSelector
        items={items}
        onAddItem={handleAddItem}
        onUpdateCantidad={handleUpdateCantidad}
        onRemoveItem={handleRemoveItem}
        total={total}
      />
      {errors.productos && (
        <span className="error-message">{errors.productos}</span>
      )}

      <div className="form-group">
        <label htmlFor="notas">Notas (opcional)</label>
        <textarea
          id="notas"
          name="notas"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          className="input"
          placeholder="Notas adicionales"
          rows={2}
        />
      </div>

      <button
        type="submit"
        className="btn btn--primary btn--full"
        disabled={loading}
      >
        {loading ? 'Guardando...' : submitText}
      </button>
    </form>
  );
};

export default PedidoForm;
