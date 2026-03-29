import { useMemo } from 'react';
import { PiEyeBold } from 'react-icons/pi';
import type { ProductoItem } from '../../types/Pedido';
import type { Producto, Etiqueta } from '../../types/Producto';
import { ETIQUETA_ICONS } from '../../constants/etiquetaIcons';

interface Props {
  productos: ProductoItem[];
  cobertura: number[];
  focusedRow: number | null;
  tableScrollRef: React.RefObject<HTMLDivElement | null>;
  format: (n: number) => string;
  pagado: number;
  total: number;
  catalogoProductos: Producto[];
  todasEtiquetas: Etiqueta[];
  onRowClick: (index: number) => void;
  onProductoClick: (item: ProductoItem) => void;
}

const Colgroup = () => (
  <colgroup>
    <col style={{ width: '8%' }} />
    <col style={{ width: '7%' }} />
    <col style={{ width: '12%' }} />
    <col style={{ width: '9%' }} />
    <col style={{ width: '14%' }} />
    <col style={{ width: '13%' }} />
    <col style={{ width: '15%' }} />
    <col style={{ width: '12%' }} />
    <col style={{ width: '10%' }} />
  </colgroup>
);

const PedidoProductosTable: React.FC<Props> = ({
  productos,
  cobertura,
  focusedRow,
  tableScrollRef,
  format,
  pagado,
  total,
  catalogoProductos,
  todasEtiquetas,
  onRowClick,
  onProductoClick,
}) => {
  const etiquetasPorClave = useMemo(() => {
    const map = new Map<string, Etiqueta[]>();
    for (const cp of catalogoProductos) {
      if (!cp.clave || !cp.etiquetas?.length) continue;
      map.set(cp.clave, cp.etiquetas
        .map(etId => todasEtiquetas.find(e => e.id === etId))
        .filter((e): e is Etiqueta => !!e));
    }
    return map;
  }, [catalogoProductos, todasEtiquetas]);

  const getEtiquetasForClave = (clave?: string): Etiqueta[] =>
    clave ? (etiquetasPorClave.get(clave) ?? []) : [];

  return (
    <div className="pedido-detail__section pedido-detail__section--grow">
      <div className="pedido-detail__table-wrapper">
        {/* Header fijo */}
        <div className="pedido-detail__table-head">
          <table className="pedido-detail__products-table">
            <Colgroup />
            <thead>
              <tr>
                <th>Clave</th>
                <th>Cant.</th>
                <th>Producto</th>
                <th>Etiquetas</th>
                <th>Precio</th>
                <th>Abonado</th>
                <th className="pedido-detail__col--right">Subtotal</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Cuerpo scrolleable */}
        <div ref={tableScrollRef} className="pedido-detail__table-scroll pedido-detail__table-scroll--grow">
          <table className="pedido-detail__products-table">
            <Colgroup />
            <tbody>
              {productos.map((p, index) => {
                const cubierto = Math.min(cobertura[index] || 0, p.subtotal);
                const porcentaje = p.subtotal > 0 ? (cubierto / p.subtotal) * 100 : 0;
                const status = porcentaje >= 100 ? 'paid' : porcentaje > 0 ? 'partial' : 'pending';
                return (
                  <tr
                    key={index}
                    className={`pedido-detail__product-row--${status}${focusedRow === index ? ' pedido-detail__product-row--focused' : ''}`}
                    onClick={() => onRowClick(index)}
                  >
                    <td>
                      {p.clave ? <span className="pedido-detail__clave">{p.clave}</span> : '-'}
                    </td>
                    <td>{p.cantidad}</td>
                    <td>
                      <span className="pedido-detail__product-name">{p.nombre}</span>
                    </td>
                    <td>
                      <div className="pedido-detail__etiquetas">
                        {getEtiquetasForClave(p.clave).map(et => {
                          const iconData = ETIQUETA_ICONS[et.icono];
                          const Icon = iconData?.icon;
                          return (
                            <span key={et.id} className="pedido-detail__etiqueta" style={{ backgroundColor: et.color }} title={et.nombre}>
                              {Icon && <Icon size={12} />}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      {p.precioOriginal && p.descuento ? (
                        <div className="pedido-detail__product-subtotal-discount">
                          <span className="pedido-detail__product-subtotal-original">{format(p.precioOriginal)}</span>
                          <span>{format(p.precioUnitario)}</span>
                        </div>
                      ) : (
                        format(p.precioUnitario)
                      )}
                    </td>
                    <td>
                      <div className="pedido-detail__product-paid-cell">
                        <span>{format(cubierto)}</span>
                      </div>
                    </td>
                    <td className="pedido-detail__col--right">
                      {p.precioOriginal && p.descuento ? (
                        <div className="pedido-detail__product-subtotal-discount">
                          <span className="pedido-detail__product-discount-badge">-{p.descuento}%</span>
                          <span className="pedido-detail__product-subtotal-original">{format(p.precioOriginal * p.cantidad)}</span>
                          <span>{format(p.subtotal)}</span>
                        </div>
                      ) : (
                        format(p.subtotal)
                      )}
                    </td>
                    <td>
                      <span className={`pedido-detail__product-status pedido-detail__product-status--${status}`}>
                        {status === 'paid' ? 'Pagado' : status === 'partial' ? `${Math.round(porcentaje)}%` : 'Pendiente'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="pedido-detail__product-eye"
                        title="Ver detalles"
                        onClick={() => onProductoClick(p)}
                      >
                        <PiEyeBold size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pie fijo (total) */}
        <div className="pedido-detail__table-foot">
          <table className="pedido-detail__products-table">
            <Colgroup />
            <tfoot className="pedido-detail__products-tfoot">
              <tr className="pedido-detail__product-total-row">
                <td><strong>Total</strong></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td>
                  <div className="pedido-detail__product-paid-cell">
                    <strong>{format(pagado)}</strong>
                  </div>
                </td>
                <td><strong>{format(total)}</strong></td>
                <td>
                  <strong className={
                    pagado >= total
                      ? 'pedido-detail__product-status--paid'
                      : pagado > 0
                        ? 'pedido-detail__product-status--partial'
                        : 'pedido-detail__product-status--pending'
                  }>
                    {pagado >= total ? 'Liquidado' : format(total - pagado)}
                  </strong>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PedidoProductosTable;
