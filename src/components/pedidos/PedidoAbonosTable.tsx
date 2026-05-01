import { useTranslation } from 'react-i18next';
import { PiCheckBold, PiXBold, PiPencilSimpleBold } from 'react-icons/pi';
import type { Abono, ProductoItem, CreadoPor, PedidoStatus } from '../../types/Pedido';
import { formatDate } from '../../utils/formatters';

interface Props {
  abonos: Abono[];
  productos: ProductoItem[];
  focusedAbonoRow: number | null;
  editingAbonoId: string | null;
  editingAbonoValue: string;
  role: string;
  estado: PedidoStatus;
  archivado: boolean;
  abonoScrollRef: React.RefObject<HTMLDivElement | null>;
  format: (n: number) => string;
  creadoPor?: CreadoPor;
  entregadoPor?: CreadoPor;
  onRowClick: (index: number) => void;
  onEditStart: (id: string, monto: number) => void;
  onEditConfirm: (id: string) => void;
  onEditCancel: () => void;
  onEditValueChange: (value: string) => void;
}

const Colgroup = () => (
  <colgroup>
    <col style={{ width: '8%' }} />
    <col style={{ width: '27%' }} />
    <col style={{ width: '14%' }} />
    <col style={{ width: '6%' }} />
    <col style={{ width: '8%' }} />
    <col style={{ width: '17%' }} />
    <col style={{ width: '20%' }} />
  </colgroup>
);

const PedidoAbonosTable: React.FC<Props> = ({
  abonos,
  productos,
  focusedAbonoRow,
  editingAbonoId,
  editingAbonoValue,
  role,
  estado,
  archivado,
  abonoScrollRef,
  format,
  creadoPor,
  entregadoPor,
  onRowClick,
  onEditStart,
  onEditConfirm,
  onEditCancel,
  onEditValueChange,
}) => {
  const { t } = useTranslation();
  const sorted = [...abonos].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return (
    <div className="pedido-detail__section pedido-detail__section--no-pad">
      <div className="pedido-detail__table-wrapper">
        {/* Header fijo */}
        <div className="pedido-detail__table-head">
          <table className="pedido-detail__abonos-table">
            <Colgroup />
            <thead>
              <tr>
                <th>{t('orders.detail.paymentsTable.code')}</th>
                <th>{t('orders.detail.paymentsTable.product')}</th>
                <th>{t('orders.detail.paymentsTable.amount')}</th>
                <th></th>
                <th></th>
                <th>{t('orders.detail.paymentsTable.by')}</th>
                <th>{t('orders.detail.paymentsTable.date')}</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Cuerpo scrolleable */}
        <div ref={abonoScrollRef} className="pedido-detail__table-scroll pedido-detail__table-scroll--fixed">
          <table className="pedido-detail__abonos-table">
            <Colgroup />
            <tbody>
              {abonos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="pedido-detail__abonos-empty">
                    {t('orders.detail.noPayments')}
                  </td>
                </tr>
              ) : (
                sorted.map((abono, i) => (
                  <tr
                    key={abono.id}
                    className={focusedAbonoRow === i ? 'pedido-detail__product-row--focused' : ''}
                    onClick={() => onRowClick(i)}
                  >
                    <td>
                      {typeof abono.productoIndex === 'number' && productos[abono.productoIndex]?.clave ? (
                        <span className="pedido-detail__clave">
                          {productos[abono.productoIndex].clave}
                        </span>
                      ) : '-'}
                    </td>
                    <td title={typeof abono.productoIndex === 'number' && productos[abono.productoIndex] ? productos[abono.productoIndex].nombre : undefined}>
                      {typeof abono.productoIndex === 'number' && productos[abono.productoIndex] ? (
                        <span className="pedido-detail__abono-autor">{productos[abono.productoIndex].nombre}</span>
                      ) : (
                        <span className="pedido-detail__general-label">{t('orders.detail.generalPayment')}</span>
                      )}
                    </td>
                    <td>
                      {editingAbonoId === abono.id ? (
                        <div className="pedido-detail__abono-edit" onClick={e => e.stopPropagation()}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            autoFocus
                            value={editingAbonoValue}
                            onChange={e => onEditValueChange(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') onEditConfirm(abono.id);
                              if (e.key === 'Escape') onEditCancel();
                            }}
                          />
                          <button className="pedido-detail__abono-edit-confirm" onClick={() => onEditConfirm(abono.id)} title={t('common.confirm')}>
                            <PiCheckBold size={14} />
                          </button>
                          <button className="pedido-detail__abono-edit-cancel" onClick={onEditCancel} title={t('common.cancel')}>
                            <PiXBold size={14} />
                          </button>
                        </div>
                      ) : (
                        <span>{format(abono.monto)}</span>
                      )}
                    </td>
                    <td>
                      {abono.montoOriginal && (
                        <span
                          className="pedido-detail__abono-editado"
                          title={`${format(abono.montoOriginal)}${abono.editadoEn ? ` · ${formatDate(abono.editadoEn)}` : ''}`}
                        >
                          {t('common.edit')}
                        </span>
                      )}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      {role === 'admin' && editingAbonoId !== abono.id && (
                        <button
                          className="pedido-detail__abono-edit-btn"
                          title={t('common.edit')}
                          disabled={estado === 'entregado' || archivado}
                          onClick={() => onEditStart(abono.id, abono.monto)}
                        >
                          <PiPencilSimpleBold size={14} />
                        </button>
                      )}
                    </td>
                    <td>
                      {abono.creadoPor && (
                        <span className="pedido-detail__abono-autor" title={abono.creadoPor.nombre}>
                          {abono.creadoPor.nombre}
                        </span>
                      )}
                    </td>
                    <td>{formatDate(abono.fecha)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {creadoPor && (
        <div className="pedido-detail__creado-por-row">
          {t('orders.detail.createdBy')} <span>{creadoPor.nombre}</span>
        </div>
      )}
      <hr className="pedido-detail__info-divider" />
      <div className="pedido-detail__creado-por-row">
        {t('orders.detail.deliveredBy')} <span>{entregadoPor ? entregadoPor.nombre : <em>{t('orders.detail.notDeliveredYet')}</em>}</span>
      </div>
    </div>
  );
};

export default PedidoAbonosTable;
