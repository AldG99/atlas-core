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
  onCancel?: () => void;
  loading?: boolean;
  initialData?: PedidoFormData;
  submitText?: string;
  defaultCliente?: Cliente;
  defaultProductos?: ProductoItem[];
}

const PedidoForm = ({
  onSubmit,
  onCancel,
  loading = false,
  initialData,
  submitText = 'Crear pedido',
  defaultCliente,
  defaultProductos
}: PedidoFormProps) => {
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(defaultCliente || null);
  const [items, setItems] = useState<ItemPedido[]>(() => {
    if (defaultProductos && defaultProductos.length > 0) {
      return defaultProductos.map((p, i) => ({
        producto: {
          id: `repeat-${i}`,
          clave: p.clave || '',
          nombre: p.nombre,
          precio: p.precioUnitario,
          userId: '',
          fechaCreacion: new Date()
        } as Producto,
        cantidad: p.cantidad,
        subtotal: p.subtotal
      }));
    }
    return [];
  });
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

    const productos: ProductoItem[] = items.map((item) => {
      const effective = getEffectivePrice(item.producto);
      const hasDiscount = effective < item.producto.precio;
      return {
        nombre: item.producto.nombre,
        clave: item.producto.clave || undefined,
        cantidad: item.cantidad,
        precioUnitario: effective,
        subtotal: item.subtotal,
        ...(hasDiscount && {
          precioOriginal: item.producto.precio,
          descuento: item.producto.descuento
        })
      };
    });

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

  const getEffectivePrice = (p: Producto): number => {
    if (p.descuento && p.descuento > 0 && p.fechaFinDescuento &&
        new Date(p.fechaFinDescuento) >= new Date(new Date().toDateString())) {
      return p.precio * (1 - p.descuento / 100);
    }
    return p.precio;
  };

  const handleAddItem = (producto: Producto) => {
    const effectivePrice = getEffectivePrice(producto);
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.producto.id === producto.id);

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          cantidad: updated[existingIndex].cantidad + 1,
          subtotal: (updated[existingIndex].cantidad + 1) * effectivePrice
        };
        return updated;
      }

      return [...prev, { producto, cantidad: 1, subtotal: effectivePrice }];
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
          ? { ...item, cantidad, subtotal: cantidad * getEffectivePrice(item.producto) }
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
        disabled={!selectedCliente}
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

      <div className="pedido-form__actions">
        {onCancel && (
          <button
            type="button"
            className="btn btn--outline btn--full"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="btn btn--primary btn--full"
          disabled={loading}
        >
          {loading ? 'Guardando...' : submitText}
        </button>
      </div>
    </form>
  );
};

export default PedidoForm;
