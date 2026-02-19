import { useMemo } from 'react';
import { PiXBold } from 'react-icons/pi';
import type { Producto, DescuentoHistorial } from '../../types/Producto';
import './HistorialDescuentosModal.scss';

interface HistorialDescuentosModalProps {
  productos: Producto[];
  onClose: () => void;
}

type Motivo = DescuentoHistorial['motivo'] | 'activo';

interface FilaHistorial {
  clave: string;
  nombre: string;
  porcentaje: number;
  fechaFin: Date;
  fechaCierre: Date | null;
  motivo: Motivo;
}

const MOTIVO_LABEL: Record<Motivo, string> = {
  activo: 'Activo',
  cancelado: 'Cancelado',
  expirado: 'Expirado'
};

const HistorialDescuentosModal = ({ productos, onClose }: HistorialDescuentosModalProps) => {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));

  const filas = useMemo<FilaHistorial[]>(() => {
    const rows: FilaHistorial[] = [];

    for (const producto of productos) {
      // Active discount
      if (producto.descuento && producto.descuento > 0 && producto.fechaFinDescuento) {
        rows.push({
          clave: producto.clave,
          nombre: producto.nombre,
          porcentaje: producto.descuento,
          fechaFin: producto.fechaFinDescuento,
          fechaCierre: null,
          motivo: 'activo'
        });
      }

      // Past discounts
      if (producto.historialDescuentos?.length) {
        for (const entry of producto.historialDescuentos) {
          rows.push({
            clave: producto.clave,
            nombre: producto.nombre,
            porcentaje: entry.porcentaje,
            fechaFin: entry.fechaFin,
            fechaCierre: entry.fechaCierre,
            motivo: entry.motivo
          });
        }
      }
    }

    // Active first, then by fechaCierre descending
    rows.sort((a, b) => {
      if (a.motivo === 'activo' && b.motivo !== 'activo') return -1;
      if (b.motivo === 'activo' && a.motivo !== 'activo') return 1;
      const dateA = a.fechaCierre ? new Date(a.fechaCierre).getTime() : 0;
      const dateB = b.fechaCierre ? new Date(b.fechaCierre).getTime() : 0;
      return dateB - dateA;
    });

    return rows;
  }, [productos]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--large historial-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Registro de descuentos</h2>
          <button className="modal__close" onClick={onClose}>
            <PiXBold size={24} />
          </button>
        </div>

        <div className="modal__body">
          {filas.length === 0 ? (
            <p className="historial-modal__empty">No hay registros de descuentos</p>
          ) : (
            <div className="historial-modal__table-wrapper">
              <table className="historial-modal__table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Descuento</th>
                    <th>Fecha fin</th>
                    <th>Fecha cierre</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((fila, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className="historial-modal__clave">{fila.clave}</span>
                        <span className="historial-modal__nombre">{fila.nombre}</span>
                      </td>
                      <td className="historial-modal__porcentaje">-{fila.porcentaje}%</td>
                      <td>{formatDate(fila.fechaFin)}</td>
                      <td>{fila.fechaCierre ? formatDate(fila.fechaCierre) : '—'}</td>
                      <td>
                        <span className={`historial-modal__motivo historial-modal__motivo--${fila.motivo}`}>
                          {MOTIVO_LABEL[fila.motivo]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistorialDescuentosModal;
