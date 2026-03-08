import { useReportes } from '../hooks/useReportes';
import { useToast } from '../hooks/useToast';
import { useClientes } from '../hooks/useClientes';
import { getCodigoPais } from '../data/codigosPais';
import { exportToCSV } from '../utils/formatters';
import MainLayout from '../layouts/MainLayout';
import KPICards from '../components/reportes/KPICards';
import PeriodFilter from '../components/reportes/PeriodFilter';
import SalesChart from '../components/reportes/SalesChart';
import StatusBreakdown from '../components/reportes/StatusBreakdown';
import TopClientes from '../components/reportes/TopClientes';
import TopProductos from '../components/reportes/TopProductos';
import InventarioStatus from '../components/reportes/InventarioStatus';
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
  const { clientes } = useClientes();

  const handleExport = () => {
    if (filteredPedidos.length === 0) {
      showToast('No hay pedidos para exportar', 'warning');
      return;
    }
    const pedidosConCodigo = filteredPedidos.map(p => ({
      ...p,
      clienteCodigoPais: getCodigoPais(clientes.find(c => c.telefono === p.clienteTelefono)?.telefonoCodigoPais ?? '')?.codigo
    }));
    exportToCSV(pedidosConCodigo, 'reporte_pedidos');
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
            <div className="reportes__layout">
              <KPICards kpis={reporteData.kpis} comparisonKPIs={reporteData.comparisonKPIs} variant="main" />
              <KPICards kpis={reporteData.kpis} comparisonKPIs={reporteData.comparisonKPIs} variant="side" />
              <div className="reportes__chart">
                <SalesChart
                  data={reporteData.chartData}
                  totalVentas={reporteData.kpis.ventasTotales}
                  totalPedidos={reporteData.kpis.totalPedidos}
                />
              </div>
              <StatusBreakdown breakdown={reporteData.statusBreakdown} />
              <div className="reportes__bottom-left">
                <TopClientes clientes={reporteData.topClientes} />
                <TopProductos productos={reporteData.topProductos} />
              </div>
              <InventarioStatus inventario={reporteData.inventario} />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Reportes;
