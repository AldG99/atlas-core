import { useReportes } from '../hooks/useReportes';
import { useToast } from '../hooks/useToast';
import { exportToCSV } from '../utils/formatters';
import MainLayout from '../layouts/MainLayout';
import KPICards from '../components/reportes/KPICards';
import PeriodFilter from '../components/reportes/PeriodFilter';
import SalesChart from '../components/reportes/SalesChart';
import StatusBreakdown from '../components/reportes/StatusBreakdown';
import TopClientes from '../components/reportes/TopClientes';
import './Reportes.scss';

const Reportes = () => {
  const {
    reporteData,
    filteredPedidos,
    period,
    loading,
    error,
    setPeriod
  } = useReportes();
  const { showToast } = useToast();

  const handleExport = () => {
    if (filteredPedidos.length === 0) {
      showToast('No hay pedidos para exportar', 'warning');
      return;
    }
    exportToCSV(filteredPedidos, 'reporte_pedidos');
    showToast('Reporte exportado', 'success');
  };

  return (
    <MainLayout>
      <div className="reportes">
        <div className="reportes__header">
          <h1>Reportes</h1>
          <button
            onClick={handleExport}
            className="btn btn--secondary"
            disabled={filteredPedidos.length === 0}
          >
            Exportar CSV
          </button>
        </div>

        <div className="reportes__filters">
          <PeriodFilter
            period={period}
            onPeriodChange={setPeriod}
          />
        </div>

        <div className="reportes__content">
          {loading && <p className="reportes__loading">Cargando datos...</p>}

          {error && <p className="reportes__error">{error}</p>}

          {!loading && !error && (
            <>
              <KPICards kpis={reporteData.kpis} />

              <div className="reportes__grid">
                <div className="reportes__chart">
                  <SalesChart
                    data={reporteData.chartData}
                    totalVentas={reporteData.kpis.ventasTotales}
                    totalPedidos={reporteData.kpis.totalPedidos}
                  />
                </div>
                <div className="reportes__sidebar">
                  <StatusBreakdown breakdown={reporteData.statusBreakdown} />
                  <TopClientes clientes={reporteData.topClientes} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Reportes;
