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
    <div className="inventory-status">
      <h3 className="inventory-status__title">{t('reports.inventory.title')}</h3>

      <div className="inventory-status__kpis">
        <div className="inventory-status__kpi">
          <span className="inventory-status__kpi-value">{totalTracked}</span>
          <span className="inventory-status__kpi-label">{t('reports.inventory.withControl')}</span>
        </div>
        <div className="inventory-status__kpi inventory-status__kpi--danger">
          <span className="inventory-status__kpi-value">{outOfStock.length}</span>
          <span className="inventory-status__kpi-label">{t('reports.inventory.empty')}</span>
        </div>
        <div className="inventory-status__kpi inventory-status__kpi--warning">
          <span className="inventory-status__kpi-value">{lowStock.length}</span>
          <span className="inventory-status__kpi-label">{t('reports.inventory.lowStock')}</span>
        </div>
      </div>

      {totalAlerts > 0 && (
        <div className="inventory-status__lists">
          {outOfStock.length > 0 && (
            <div className="inventory-status__group">
              <span className="inventory-status__group-label inventory-status__group-label--danger">
                {t('reports.inventory.empty')}
              </span>
              <ul className="inventory-status__list">
                {outOfStock.map((item) => (
                  <li key={item.id} className="inventory-status__item inventory-status__item--danger">
                    {item.sku && (
                      <span className="inventory-status__sku">{item.sku}</span>
                    )}
                    <span className="inventory-status__name">{item.name}</span>
                    <span className="inventory-status__stock">0</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {lowStock.length > 0 && (
            <div className="inventory-status__group">
              <span className="inventory-status__group-label inventory-status__group-label--warning">
                {t('reports.inventory.lowStockLabel')}
              </span>
              <ul className="inventory-status__list">
                {lowStock.map((item) => (
                  <li key={item.id} className="inventory-status__item inventory-status__item--warning">
                    {item.sku && (
                      <span className="inventory-status__sku">{item.sku}</span>
                    )}
                    <span className="inventory-status__name">{item.name}</span>
                    <span className="inventory-status__stock">{item.stock}</span>
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
