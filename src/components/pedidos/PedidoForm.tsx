import type { FormEvent } from 'react';
import { useState, useEffect } from 'react';
import type { PedidoFormData } from '../../types/Pedido';
import type { Producto } from '../../types/Producto';
import type { Cliente } from '../../types/Cliente';
import { VALIDATION_MESSAGES } from '../../constants/messages';
import ProductoSelector from './ProductoSelector';
import ClienteSelector from './ClienteSelector';
import './PedidoForm.scss';

interface PedidoFormProps {
  onSubmit: (data: PedidoFormData) => Promise<void>;
  loading?: boolean;
  initialData?: PedidoFormData;
  submitText?: string;
}

const defaultFormData: PedidoFormData = {
  clienteNombre: '',
  clienteTelefono: '',
  productos: '',
  total: 0,
  notas: ''
};

const PedidoForm = ({
  onSubmit,
  loading = false,
  initialData,
  submitText = 'Crear pedido'
}: PedidoFormProps) => {
  const [formData, setFormData] = useState<PedidoFormData>(initialData || defaultFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof PedidoFormData, string>>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PedidoFormData, string>> = {};

    if (!formData.clienteNombre.trim()) {
      newErrors.clienteNombre = VALIDATION_MESSAGES.REQUIRED_FIELD;
    }

    if (!formData.clienteTelefono.trim()) {
      newErrors.clienteTelefono = VALIDATION_MESSAGES.REQUIRED_FIELD;
    }

    if (!formData.productos.trim()) {
      newErrors.productos = VALIDATION_MESSAGES.REQUIRED_FIELD;
    }

    if (formData.total <= 0) {
      newErrors.total = VALIDATION_MESSAGES.MIN_TOTAL;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await onSubmit(formData);

    if (!initialData) {
      setFormData(defaultFormData);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'total' ? parseFloat(value) || 0 : value
    }));

    if (errors[name as keyof PedidoFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleProductSelect = (producto: Producto) => {
    setFormData((prev) => ({
      ...prev,
      productos: prev.productos
        ? `${prev.productos}\n${producto.nombre} - $${producto.precio.toFixed(2)}`
        : `${producto.nombre} - $${producto.precio.toFixed(2)}`,
      total: prev.total + producto.precio
    }));

    if (errors.productos) {
      setErrors((prev) => ({ ...prev, productos: undefined }));
    }
  };

  const handleAddProductText = (nombre: string, precio: number) => {
    setFormData((prev) => ({
      ...prev,
      productos: prev.productos
        ? `${prev.productos}\n${nombre} - $${precio.toFixed(2)}`
        : `${nombre} - $${precio.toFixed(2)}`,
      total: prev.total + precio
    }));

    if (errors.productos) {
      setErrors((prev) => ({ ...prev, productos: undefined }));
    }
  };

  const handleClienteSelect = (cliente: Cliente) => {
    setFormData((prev) => ({
      ...prev,
      clienteNombre: cliente.nombre,
      clienteTelefono: cliente.telefono
    }));

    if (errors.clienteNombre) {
      setErrors((prev) => ({ ...prev, clienteNombre: undefined }));
    }
    if (errors.clienteTelefono) {
      setErrors((prev) => ({ ...prev, clienteTelefono: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="pedido-form">
      <ClienteSelector onSelect={handleClienteSelect} />

      <div className="form-group">
        <label htmlFor="clienteNombre">Nombre del cliente</label>
        <input
          type="text"
          id="clienteNombre"
          name="clienteNombre"
          value={formData.clienteNombre}
          onChange={handleChange}
          className={`input ${errors.clienteNombre ? 'input--error' : ''}`}
          placeholder="Nombre del cliente"
        />
        {errors.clienteNombre && (
          <span className="error-message">{errors.clienteNombre}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="clienteTelefono">Teléfono / Contacto</label>
        <input
          type="text"
          id="clienteTelefono"
          name="clienteTelefono"
          value={formData.clienteTelefono}
          onChange={handleChange}
          className={`input ${errors.clienteTelefono ? 'input--error' : ''}`}
          placeholder="Número de teléfono"
        />
        {errors.clienteTelefono && (
          <span className="error-message">{errors.clienteTelefono}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="productos">Productos</label>
        <ProductoSelector
          onSelect={handleProductSelect}
          onAddProductText={handleAddProductText}
        />
        <textarea
          id="productos"
          name="productos"
          value={formData.productos}
          onChange={handleChange}
          className={`input ${errors.productos ? 'input--error' : ''}`}
          placeholder="Lista de productos"
          rows={3}
        />
        {errors.productos && (
          <span className="error-message">{errors.productos}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="total">Total</label>
        <input
          type="number"
          id="total"
          name="total"
          value={formData.total || ''}
          onChange={handleChange}
          className={`input ${errors.total ? 'input--error' : ''}`}
          placeholder="0.00"
          min="0"
          step="0.01"
        />
        {errors.total && (
          <span className="error-message">{errors.total}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="notas">Notas (opcional)</label>
        <textarea
          id="notas"
          name="notas"
          value={formData.notas}
          onChange={handleChange}
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
