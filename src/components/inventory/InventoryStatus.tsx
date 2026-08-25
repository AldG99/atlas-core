import { useTranslation } from 'react-i18next';
import { Package, DollarSign, PackageX, TrendingDown } from 'lucide-react';
import type { InventoryStats } from '../../types/Inventory';
import { useCurrency } from '../../hooks/useCurrency';
import './InventoryStatus.scss';

interface InventoryStatusProps {
  inventory: InventoryStats;
}

const InventoryStatus = ({ inventory }: InventoryStatusProps) => {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const { totalTracked, totalValue, outOfStock, lowStock } = inventory;

  return (
    <div className="inventory-status">
      <div className="inventory-status__kpis">
        <div className="inventory-status__kpi">
          <div className="inventory-status__kpi-icon">
            <Package size={20} />
          </div>
          <div className="inventory-status__kpi-content">
            <span className="inventory-status__kpi-label">{t('inventory.withControl')}</span>
            <span className="inventory-status__kpi-value">{totalTracked}</span>
          </div>
        </div>
        <div className="inventory-status__kpi">
          <div className="inventory-status__kpi-icon inventory-status__kpi-icon--primary">
            <DollarSign size={20} />
          </div>
          <div className="inventory-status__kpi-content">
            <span className="inventory-status__kpi-label">{t('inventory.totalValue')}</span>
            <span className="inventory-status__kpi-value">{format(totalValue)}</span>
          </div>
        </div>
        <div className="inventory-status__kpi">
          <div className="inventory-status__kpi-icon inventory-status__kpi-icon--danger">
            <PackageX size={20} />
          </div>
          <div className="inventory-status__kpi-content">
            <span className="inventory-status__kpi-label">{t('inventory.empty')}</span>
            <span className="inventory-status__kpi-value">{outOfStock.length}</span>
          </div>
        </div>
        <div className="inventory-status__kpi">
          <div className="inventory-status__kpi-icon inventory-status__kpi-icon--warning">
            <TrendingDown size={20} />
          </div>
          <div className="inventory-status__kpi-content">
            <span className="inventory-status__kpi-label">{t('inventory.lowStock')}</span>
            <span className="inventory-status__kpi-value">{lowStock.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryStatus;
