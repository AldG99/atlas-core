import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PiXBold, PiDownloadSimpleBold } from 'react-icons/pi';
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

const HistorialDescuentosModal = ({ productos, onClose }: HistorialDescuentosModalProps) => {
  const { t, i18n } = useTranslation();

  const MOTIVO_LABEL: Record<Motivo, string> = {
    activo: t('products.discountModal.statusActive'),
    cancelado: t('products.discountModal.statusCanceled'),
    expirado: t('products.discountModal.statusExpired')
  };

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat(i18n.language, {
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

  const handleExportCSV = () => {
    const headers = [t('orders.code'), t('orders.product'), t('products.discountModal.table.discount'), t('products.discountModal.table.endDate'), t('products.discountModal.table.closeDate'), t('products.discountModal.table.status')];
    const rows = filas.map(f => [
      f.clave,
      f.nombre,
      `-${f.porcentaje}%`,
      formatDate(f.fechaFin),
      f.fechaCierre ? formatDate(f.fechaCierre) : '',
      MOTIVO_LABEL[f.motivo],
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `descuentos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--large historial-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>{t('products.discountModal.title')}</h2>
          <div className="modal__header-actions">
            <button
              className="btn btn--secondary btn--sm"
              onClick={handleExportCSV}
              disabled={filas.length === 0}
            >
              <PiDownloadSimpleBold size={15} />
              {t('products.discountModal.export')}
            </button>
            <button className="modal__close" onClick={onClose}>
              <PiXBold size={24} />
            </button>
          </div>
        </div>

        <div className="modal__body">
          {filas.length === 0 ? (
            <p className="historial-modal__empty">{t('products.discountModal.empty')}</p>
          ) : (
            <div className="historial-modal__table-wrapper">
              <table className="historial-modal__table">
                <thead>
                  <tr>
                    <th>{t('products.discountModal.table.product')}</th>
                    <th>{t('products.discountModal.table.discount')}</th>
                    <th>{t('products.discountModal.table.endDate')}</th>
                    <th>{t('products.discountModal.table.closeDate')}</th>
                    <th>{t('products.discountModal.table.status')}</th>
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
