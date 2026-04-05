import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PiMagnifyingGlassBold, PiDownloadSimpleBold } from 'react-icons/pi';
import type { Pedido } from '../types/Pedido';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useClientes } from '../hooks/useClientes';
import { getCodigoPais } from '../data/codigosPais';
import { getArchivedPedidos } from '../services/pedidoService';
import { exportToCSV } from '../utils/formatters';
import MainLayout from '../layouts/MainLayout';
import PedidosTable from '../components/pedidos/PedidosTable';
import './Archivo.scss';

type SortOption = 'fecha_desc' | 'fecha_asc' | 'total_desc' | 'total_asc' | 'nombre_asc';
type DateFilter = 'todos' | 'semana' | 'mes' | 'trimestre';

const Archivo = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { clientes } = useClientes();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('fecha_desc');
  const [dateFilter, setDateFilter] = useState<DateFilter>('todos');

  const SORT_OPTIONS: Record<SortOption, string> = {
    fecha_desc: t('archive.sortNewest'),
    fecha_asc: t('archive.sortOldest'),
    total_desc: t('archive.sortTotalDesc'),
    total_asc: t('archive.sortTotalAsc'),
    nombre_asc: t('archive.sortName'),
  };

  const DATE_FILTERS: Record<DateFilter, string> = {
    todos: t('archive.allTime'),
    semana: t('archive.lastWeek'),
    mes: t('archive.lastMonth'),
    trimestre: t('archive.lastQuarter'),
  };

  const fetchArchived = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getArchivedPedidos(user.uid);
      setPedidos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos archivados');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchArchived();
  }, [fetchArchived]);

  const filteredAndSortedPedidos = useMemo(() => {
    let result = [...pedidos];

    if (dateFilter !== 'todos') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      result = result.filter((pedido) => {
        const pedidoDate = new Date(pedido.fechaCreacion);

        switch (dateFilter) {
          case 'semana': {
            const weekAgo = new Date(startOfDay);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return pedidoDate >= weekAgo;
          }
          case 'mes': {
            const monthAgo = new Date(startOfDay);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return pedidoDate >= monthAgo;
          }
          case 'trimestre': {
            const quarterAgo = new Date(startOfDay);
            quarterAgo.setMonth(quarterAgo.getMonth() - 3);
            return pedidoDate >= quarterAgo;
          }
          default:
            return true;
        }
      });
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (pedido) =>
          pedido.clienteNombre.toLowerCase().includes(term) ||
          pedido.clienteTelefono.toLowerCase().includes(term) ||
          (pedido.folio?.toLowerCase().includes(term) ?? false)
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'fecha_desc':
          return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
        case 'fecha_asc':
          return new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime();
        case 'total_desc':
          return b.total - a.total;
        case 'total_asc':
          return a.total - b.total;
        case 'nombre_asc':
          return a.clienteNombre.localeCompare(b.clienteNombre);
        default:
          return 0;
      }
    });

    return result;
  }, [pedidos, searchTerm, sortBy, dateFilter]);

  const handleExport = () => {
    if (filteredAndSortedPedidos.length === 0) {
      showToast(t('archive.noExport'), 'warning');
      return;
    }
    const pedidosConCodigo = filteredAndSortedPedidos.map(p => ({
      ...p,
      clienteCodigoPais: getCodigoPais(clientes.find(c => c.telefono === p.clienteTelefono)?.telefonoCodigoPais ?? '')?.codigo
    }));
    exportToCSV(pedidosConCodigo, 'pedidos_archivados');
    showToast(t('archive.exportSuccess'), 'success');
  };

  return (
    <MainLayout>
      <div className="archivo">
        <div className="archivo__header">
          <h1>{t('archive.title')}</h1>
          <div className="archivo__header-actions">
            <button
              onClick={handleExport}
              className="btn btn--secondary"
              disabled={pedidos.length === 0}
            >
              <PiDownloadSimpleBold size={18} />
              {t('common.exportCsv')}
            </button>
          </div>
        </div>

        <div className="archivo__controls">
          <div className="archivo__search">
            <PiMagnifyingGlassBold size={16} className="archivo__search-icon" />
            <input
              type="text"
              placeholder={t('archive.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>

          <div className="archivo__selects">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="select"
            >
              {(Object.keys(DATE_FILTERS) as DateFilter[]).map((filter) => (
                <option key={filter} value={filter}>
                  {DATE_FILTERS[filter]}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="select"
            >
              {(Object.keys(SORT_OPTIONS) as SortOption[]).map((option) => (
                <option key={option} value={option}>
                  {SORT_OPTIONS[option]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <PedidosTable
          pedidos={filteredAndSortedPedidos}
          loading={loading}
          error={error}
          searchTerm={searchTerm}
        />
      </div>
    </MainLayout>
  );
};

export default Archivo;
