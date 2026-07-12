import { useTranslation } from 'react-i18next';
import type { InventoryStats } from '../../types/Report';
import './InventoryStatus.scss';

interface InventoryStatusProps {
  inventory: InventoryStats;
}

const InventoryStatus = ({ inventory }: InventoryStatusProps) => {
  const { t } = useTranslation();
  const { totalTracked, outOfStock, lowStock } = inventory;
  const totalAlerts = outOfStock.length + lowStock.length;

  return (
    <div className="inventario-status">
      <h3 className="inventario-status__title">{t('reports.inventory.title')}</h3>

      <div className="inventario-status__kpis">
        <div className="inventario-status__kpi">
          <span className="inventario-status__kpi-value">{totalTracked}</span>
          <span className="inventario-status__kpi-label">{t('reports.inventory.withControl')}</span>
        </div>
        <div className="inventario-status__kpi inventario-status__kpi--danger">
          <span className="inventario-status__kpi-value">{outOfStock.length}</span>
          <span className="inventario-status__kpi-label">{t('reports.inventory.empty')}</span>
        </div>
        <div className="inventario-status__kpi inventario-status__kpi--warning">
          <span className="inventario-status__kpi-value">{lowStock.length}</span>
          <span className="inventario-status__kpi-label">{t('reports.inventory.lowStock')}</span>
        </div>
      </div>

      {totalAlerts > 0 && (
        <div className="inventario-status__lists">
          {outOfStock.length > 0 && (
            <div className="inventario-status__group">
              <span className="inventario-status__group-label inventario-status__group-label--danger">
                {t('reports.inventory.empty')}
              </span>
              <ul className="inventario-status__list">
                {outOfStock.map((item) => (
                  <li key={item.id} className="inventario-status__item inventario-status__item--danger">
                    {item.sku && (
                      <span className="inventario-status__clave">{item.sku}</span>
                    )}
                    <span className="inventario-status__name">{item.name}</span>
                    <span className="inventario-status__stock">0</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {lowStock.length > 0 && (
            <div className="inventario-status__group">
              <span className="inventario-status__group-label inventario-status__group-label--warning">
                {t('reports.inventory.lowStockLabel')}
              </span>
              <ul className="inventario-status__list">
                {lowStock.map((item) => (
                  <li key={item.id} className="inventario-status__item inventario-status__item--warning">
                    {item.sku && (
                      <span className="inventario-status__clave">{item.sku}</span>
                    )}
                    <span className="inventario-status__name">{item.name}</span>
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


export default InventoryStatus;
