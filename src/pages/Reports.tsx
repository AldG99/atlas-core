import { useTranslation } from 'react-i18next';
import { useReports } from '../hooks/useReports';
import { useToast } from '../hooks/useToast';
import { useClients } from '../hooks/useClients';
import { getCountryCode } from '../data/countryCodes';
import { PiDownloadSimpleBold } from 'react-icons/pi';
import { exportToCSV } from '../utils/formatters';
import MainLayout from '../layouts/MainLayout';
import KPICards from '../components/reports/KPICards';
import PeriodFilter from '../components/reports/PeriodFilter';
import SalesChart from '../components/reports/SalesChart';
import StatusBreakdown from '../components/reports/StatusBreakdown';
import TopClients from '../components/reports/TopClients';
import TopProducts from '../components/reports/TopProducts';
import InventoryStatus from '../components/reports/InventoryStatus';
import './Reports.scss';

const Reports = () => {
  const { t } = useTranslation();
  const {
    reportData,
    filteredOrders,
    period,
    loading,
    error,
    hasMore,
    setPeriod
  } = useReports();
  const { showToast } = useToast();
  const { clients } = useClients();

  const handleExport = () => {
    if (filteredOrders.length === 0) {
      showToast(t('reports.noDataExport'), 'warning');
      return;
    }
    const ordersWithCode = filteredOrders.map(o => ({
      ...o,
      clientCountryCode: getCountryCode(clients.find(c => c.phone === o.clientPhone)?.phoneCountryCode ?? '')?.code
    }));
    exportToCSV(ordersWithCode, `reporte_${period}`);
    showToast(t('reports.export'), 'success');
  };

  return (
    <MainLayout>
      <div className="reportes">
        <div className="reportes__header">
          <h1>{t('reports.title')}</h1>
          <button
            onClick={handleExport}
            className="btn btn--secondary"
            disabled={filteredOrders.length === 0}
          >
            <PiDownloadSimpleBold size={18} />
            {t('reports.export')}
          </button>
        </div>

        <div className="reportes__filters">
          <PeriodFilter
            period={period}
            onPeriodChange={setPeriod}
          />
          {hasMore && (
            <p className="reportes__limit-warning">{t('reports.limitWarning')}</p>
          )}
        </div>

        <div className="reportes__content">
          {loading && (
            <div className="reportes__skeleton">
              <div className="reportes__skeleton-kpis">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="reportes__skeleton-card" />
                ))}
              </div>
              <div className="reportes__skeleton-card reportes__skeleton-card--tall" />
              <div className="reportes__skeleton-card reportes__skeleton-card--tall" />
            </div>
          )}

          {error && <p className="reportes__error">{error}</p>}

          {!loading && !error && (
            <div className="reportes__layout">
              <KPICards kpis={reportData.kpis} comparisonKPIs={reportData.comparisonKPIs} variant="main" />
              <KPICards kpis={reportData.kpis} comparisonKPIs={reportData.comparisonKPIs} variant="side" />
              <div className="reportes__chart">
                <SalesChart
                  data={reportData.chartData}
                  totalSales={reportData.kpis.totalSales}
                  totalOrders={reportData.kpis.totalOrders}
                />
              </div>
              <StatusBreakdown breakdown={reportData.statusBreakdown} />
              <div className="reportes__bottom-left">
                <TopClients clients={reportData.topClients} />
                <TopProducts products={reportData.topProducts} />
              </div>
              <InventoryStatus inventory={reportData.inventory} />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Reports;
