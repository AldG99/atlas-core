import { useTranslation } from 'react-i18next';
import type { InventarioStats } from '../../types/Reporte';
import './InventarioStatus.scss';

interface InventarioStatusProps {
  inventario: InventarioStats;
}

const InventarioStatus = ({ inventario }: InventarioStatusProps) => {
  const { t } = useTranslation();
  const { totalConControl, agotados, bajoStock } = inventario;
  const totalAlertas = agotados.length + bajoStock.length;

  return (
    <div className="inventario-status">
      <h3 className="inventario-status__title">{t('reports.inventory.title')}</h3>

      <div className="inventario-status__kpis">
        <div className="inventario-status__kpi">
          <span className="inventario-status__kpi-value">{totalConControl}</span>
          <span className="inventario-status__kpi-label">{t('reports.inventory.withControl')}</span>
        </div>
        <div className="inventario-status__kpi inventario-status__kpi--danger">
          <span className="inventario-status__kpi-value">{agotados.length}</span>
          <span className="inventario-status__kpi-label">{t('reports.inventory.empty')}</span>
        </div>
        <div className="inventario-status__kpi inventario-status__kpi--warning">
          <span className="inventario-status__kpi-value">{bajoStock.length}</span>
          <span className="inventario-status__kpi-label">{t('reports.inventory.lowStock')}</span>
        </div>
      </div>

      {totalAlertas > 0 && (
        <div className="inventario-status__lists">
          {agotados.length > 0 && (
            <div className="inventario-status__group">
              <span className="inventario-status__group-label inventario-status__group-label--danger">
                {t('reports.inventory.empty')}
              </span>
              <ul className="inventario-status__list">
                {agotados.map((item) => (
                  <li key={item.id} className="inventario-status__item inventario-status__item--danger">
                    {item.clave && (
                      <span className="inventario-status__clave">{item.clave}</span>
                    )}
                    <span className="inventario-status__name">{item.nombre}</span>
                    <span className="inventario-status__stock">0</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {bajoStock.length > 0 && (
            <div className="inventario-status__group">
              <span className="inventario-status__group-label inventario-status__group-label--warning">
                {t('reports.inventory.lowStockLabel')}
              </span>
              <ul className="inventario-status__list">
                {bajoStock.map((item) => (
                  <li key={item.id} className="inventario-status__item inventario-status__item--warning">
                    {item.clave && (
                      <span className="inventario-status__clave">{item.clave}</span>
                    )}
                    <span className="inventario-status__name">{item.nombre}</span>
                    <span className="inventario-status__stock">{item.stock}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


export default InventarioStatus;
