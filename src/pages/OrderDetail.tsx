import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PiArrowRightBold,
  PiStarFill,
  PiCaretRightBold,
} from 'react-icons/pi';
import { toPng } from 'html-to-image';
import OrderCapture from '../components/orders/OrderCapture';
import type { Order, OrderStatus } from '../types/Order';
import type { Product } from '../types/Product';
import { ORDER_STATUS_COLORS } from '../constants/orderStatus';
import {
  formatDate,
  getTotalPaid,
  buildOrderMessage,
  openWhatsApp,
  copyToClipboard,
  formatPhone,
} from '../utils/formatters';
import { DEFAULT_TEMPLATES } from '../types/User';
import { useCurrency } from '../hooks/useCurrency';
import { getCountryCode } from '../data/countryCodes';
import {
  getOrderById,
  updateOrderStatus,
  addPayment,
  updatePayment,
  deleteOrder,
} from '../services/orderService';
import { useAuth } from '../hooks/useAuth';
import { buildCreatedBy } from '../hooks/useOrders';
import { useClients } from '../hooks/useClients';
import { useProducts } from '../hooks/useProducts';
import { useLabels } from '../hooks/useLabels';
import { useToast } from '../hooks/useToast';
import { ROUTES } from '../config/routes';
import OrderTopBar from '../components/orders/OrderTopBar';
import OrderDeleteModal from '../components/orders/OrderDeleteModal';
import OrderItemsTable from '../components/orders/OrderItemsTable';
import OrderPaymentsTable from '../components/orders/OrderPaymentsTable';
import ProductDetailModal from '../components/products/ProductDetailModal';
import Avatar from '../components/ui/Avatar';
import MainLayout from '../layouts/MainLayout';
import './OrderDetail.scss';

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const backRoute = (location.state as { from?: string })?.from || ROUTES.DASHBOARD;
  const { user, businessUid, role } = useAuth();
  const { showToast } = useToast();
  const { clients } = useClients();
  const { products: productCatalog } = useProducts();
  const { labels: allLabels } = useLabels();
  const { symbol, format } = useCurrency();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [paymentInput, setPaymentInput] = useState('');
  const [paymentProduct, setPaymentProduct] = useState('general');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    null
  );
  const [focusedRow, setFocusedRow] = useState<number | null>(null);
  const [focusedPaymentRow, setFocusedPaymentRow] = useState<number | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editingPaymentValue, setEditingPaymentValue] = useState('');
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const paymentScrollRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadDate, setDownloadDate] = useState<Date | null>(null);

  const fetchOrder = useCallback(async (silent = false) => {
    if (!id || !user || !businessUid) return;
    try {
      if (!silent) setLoading(true);
      const data = await getOrderById(id, businessUid);
      if (!data) {
        if (!silent) {
          showToast(t('orders.detail.notFound'), 'error');
          navigate(backRoute);
        }
        return;
      }
      setOrder(data);
    } catch {
      if (!silent) {
        showToast(t('orders.detail.loadError'), 'error');
        navigate(backRoute);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id, user, businessUid, navigate, showToast, backRoute, t]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchOrder(true);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchOrder]);

  useEffect(() => {
    if (!order) return;
    const itemsLen = order.items.length;
    const paymentsLen = (order.payments || []).length;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (['input', 'select', 'textarea'].includes(tag)) return;

      const updateProductModal = (newIndex: number) => {
        if (!selectedProduct) return;
        const i = order.items[newIndex];
        const found = i?.sku ? productCatalog.find(cp => cp.sku === i.sku) : undefined;
        setSelectedProduct(found ?? null);
      };

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (focusedPaymentRow !== null) {
          setFocusedPaymentRow(prev => Math.min((prev ?? 0) + 1, paymentsLen - 1));
        } else if (focusedRow === itemsLen - 1 && paymentsLen > 0) {
          setFocusedRow(null);
          setFocusedPaymentRow(0);
          setSelectedProduct(null);
        } else {
          const newRow = focusedRow === null ? 0 : Math.min(focusedRow + 1, itemsLen - 1);
          setFocusedRow(newRow);
          updateProductModal(newRow);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (focusedPaymentRow === 0) {
          setFocusedPaymentRow(null);
          setFocusedRow(itemsLen - 1);
        } else if (focusedPaymentRow !== null) {
          setFocusedPaymentRow(prev => Math.max((prev ?? 0) - 1, 0));
        } else {
          const newRow = focusedRow === null ? 0 : Math.max(focusedRow - 1, 0);
          setFocusedRow(newRow);
          updateProductModal(newRow);
        }
      } else if (e.key === 'Enter' && focusedRow !== null) {
        e.preventDefault();
        if (selectedProduct) {
          setSelectedProduct(null);
        } else {
          const i = order.items[focusedRow];
          const found = i.sku
            ? productCatalog.find(cp => cp.sku === i.sku)
            : undefined;
          if (found) {
            setSelectedProduct(found);
          } else {
            showToast(t('orders.detail.productUnavailable'), 'warning');
          }
        }
      } else if (e.key === 'Escape' && selectedProduct) {
        setSelectedProduct(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [order, focusedRow, focusedPaymentRow, selectedProduct, productCatalog, showToast, t]);

  useEffect(() => {
    if (focusedRow === null || !tableScrollRef.current) return;
    const rows = tableScrollRef.current.querySelectorAll('tr');
    const row = rows[focusedRow];
    if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedRow]);

  useEffect(() => {
    if (focusedPaymentRow === null || !paymentScrollRef.current) return;
    const rows = paymentScrollRef.current.querySelectorAll('tr');
    const row = rows[focusedPaymentRow];
    if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusedPaymentRow]);

  const coverage = useMemo(() => {
    if (!order) return [] as number[];
    const payments = order.payments || [];
    const assignedPerItem: number[] = order.items.map(() => 0);
    let generalPool = 0;
    payments.forEach(p => {
      if (
        typeof p.itemIndex === 'number' &&
        p.itemIndex >= 0 &&
        p.itemIndex < order.items.length
      ) {
        assignedPerItem[p.itemIndex] += p.amount;
      } else {
        generalPool += p.amount;
      }
    });
    const result = [...assignedPerItem];
    order.items.forEach((i, idx) => {
      const missing = Math.max(0, i.subtotal - result[idx]);
      const portion = Math.min(generalPool, missing);
      result[idx] += portion;
      generalPool -= portion;
    });
    return result;
  }, [order]);

  const handleDownload = async () => {
    if (!order) return;
    setDownloading(true);
    setDownloadDate(new Date());
    await new Promise(resolve => setTimeout(resolve, 80));
    try {
      if (!captureRef.current) throw new Error('Ref no disponible');
      const dataUrl = await toPng(captureRef.current, { pixelRatio: 2, skipFonts: true });
      const link = document.createElement('a');
      link.download = `${order.orderNumber || order.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      showToast(t('orders.detail.imageError'), 'error');
    } finally {
      setDownloading(false);
    }
  };

  const buildMessage = (o: typeof order): string => {
    if (!o) return '';
    return buildOrderMessage(o, user?.templates ?? DEFAULT_TEMPLATES, symbol, user?.businessName ?? '');
  };

  const handleCopy = async () => {
    if (!order) return;
    const success = await copyToClipboard(buildMessage(order));
    if (success) {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    if (!order) return;
    openWhatsApp(order.clientPhone, buildMessage(order));
  };

  const handleChangeStatus = async (status: OrderStatus) => {
    if (!order || submitting) return;
    try {
      setSubmitting(true);
      const deliveredBy = status === 'delivered' && user ? buildCreatedBy(user) : undefined;
      await updateOrderStatus(order.id, status, deliveredBy);
      setOrder({ ...order, status, ...(deliveredBy ? { deliveredBy } : {}) });
      showToast(t('orders.detail.statusChanged', { status: t(`orders.status.${status}`) }), 'success');
    } catch {
      showToast(t('orders.detail.statusChangeError'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!order) return;
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!order) return;
    if (deleteConfirmText !== order.orderNumber) return;
    setShowDeleteModal(false);
    try {
      await deleteOrder(order.id);
      showToast(t('orders.detail.deleted'), 'success');
      navigate(backRoute);
    } catch {
      showToast(t('orders.detail.deleteError'), 'error');
    }
  };

  const handleAddPayment = async () => {
    if (!order || submitting) return;
    const amount = parseFloat(paymentInput);
    if (!amount || amount <= 0) return;
    setPaymentError(null);

    const totalPaid = getTotalPaid(order);
    const remaining = Math.round((order.total - totalPaid) * 100) / 100;

    if (remaining <= 0) {
      setPaymentError(t('orders.detail.paymentAlreadyPaid'));
      return;
    }

    if (Math.round(amount * 100) / 100 > remaining) {
      setPaymentError(t('orders.detail.paymentExceedsRemaining', { remaining: format(remaining) }));
      return;
    }

    try {
      setSubmitting(true);
      const itemIndex =
        paymentProduct === 'general' ? undefined : parseInt(paymentProduct, 10);
      const createdBy = user ? buildCreatedBy(user) : undefined;
      const { payment: newPayment, newStatus } = await addPayment(order.id, amount, itemIndex, createdBy);
      const updatedPayments = [...(order.payments || []), newPayment];
      setOrder({ ...order, payments: updatedPayments, status: newStatus ?? order.status });
      setPaymentInput('');
      setPaymentProduct('general');
      showToast(t('orders.detail.paymentRecorded'), 'success');
    } catch {
      showToast(t('orders.detail.paymentRecordError'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePayment = async (paymentId: string) => {
    if (!order) return;
    const newAmount = parseFloat(editingPaymentValue);
    if (isNaN(newAmount) || newAmount <= 0) {
      showToast(t('orders.detail.paymentCorrectionFailed'), 'error');
      return;
    }
    const otherPayments = (order.payments || []).filter(p => p.id !== paymentId);
    const totalOthers = otherPayments.reduce((s, p) => s + p.amount, 0);
    if (Math.round((totalOthers + newAmount) * 100) / 100 > order.total) {
      showToast(t('orders.detail.paymentTotalExceeded', { total: format(order.total) }), 'error');
      return;
    }
    try {
      const updatedPayments = await updatePayment(order.id, paymentId, newAmount);
      setOrder({ ...order, payments: updatedPayments });
      setEditingPaymentId(null);
      showToast(t('orders.detail.paymentCorrected'), 'success');
    } catch {
      showToast(t('orders.detail.paymentCorrectionError'), 'error');
    }
  };

  const clientData = useMemo(
    () => clients.find(c => c.phone === order?.clientPhone),
    [clients, order?.clientPhone]
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="order-detail">
          <p className="order-detail__loading">{t('orders.detail.loading')}</p>
        </div>
      </MainLayout>
    );
  }

  if (!order) return null;

  const paid = getTotalPaid(order);
  const clientPhoto = order.clientPhoto ?? clientData?.profilePhoto;
  const clientFavorite = clientData?.favorite ?? false;
  const payments = order.payments || [];

  const settled = paid >= order.total;
  const canMarkDelivered = order.status === 'preparing';

  return (
    <MainLayout>
      <div className="order-detail">
        <OrderTopBar
          order={order}
          copiedId={copiedId}
          downloading={downloading}
          submitting={submitting}
          role={role}
          settled={settled}
          canMarkDelivered={canMarkDelivered}
          paymentInput={paymentInput}
          paymentProduct={paymentProduct}
          paymentError={paymentError}
          onBack={() => navigate(backRoute)}
          onWhatsApp={handleWhatsApp}
          onCopy={handleCopy}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onPaymentInputChange={v => { setPaymentInput(v); setPaymentError(null); }}
          onPaymentProductChange={setPaymentProduct}
          onPay={handleAddPayment}
          onDeliver={() => handleChangeStatus('delivered')}
        />

        {/* Scrollable Content */}
        <div className="order-detail__content">
          <div className="order-detail__card">
          <div className="order-detail__header">
            <div className="order-detail__client">
              <div className="order-detail__avatar">
                <Avatar
                  src={clientPhoto}
                  initials={clientData ? `${clientData.firstName[0]}${clientData.lastName?.[0] ?? ''}`.toUpperCase() : order.clientName[0].toUpperCase()}
                  alt={order.clientName}
                />
              </div>
              <div className="order-detail__client-info">
                <div className="order-detail__name-row">
                  <h1 className="order-detail__name">{order.clientName}</h1>
                  {clientFavorite && <PiStarFill size={14} className="order-detail__fav-icon" />}
                </div>
                <span className="order-detail__phone">
                  {clientData?.phoneCountryCode
                    ? `${getCountryCode(clientData.phoneCountryCode)?.code ?? ''} ${formatPhone(order.clientPhone)}`
                    : formatPhone(order.clientPhone)}
                </span>
              </div>
            </div>
            <div className="order-detail__header-right">
              <div className="order-detail__header-top-row">
                {order.orderNumber && (
                  <>
                    <span className="order-detail__order-number">{order.orderNumber}</span>
                    <PiCaretRightBold size={12} className="order-detail__order-number-sep" />
                  </>
                )}
                <span
                  className="order-detail__status-badge"
                  style={{ color: ORDER_STATUS_COLORS[order.status] }}
                >
                  <span
                    className="order-detail__status-dot"
                    style={{ backgroundColor: ORDER_STATUS_COLORS[order.status] }}
                  />
                  {t(`orders.status.${order.status}`)}
                </span>
              </div>
              <div className="order-detail__date-status-row">
                <span className="order-detail__date">
                  {formatDate(order.createdAt)}
                </span>
                {order.deliveredAt && (
                  <>
                    <PiArrowRightBold size={12} className="order-detail__date-arrow" />
                    <span className="order-detail__date order-detail__date--delivery">
                      {formatDate(order.deliveredAt)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <OrderItemsTable
            items={order.items}
            coverage={coverage}
            focusedRow={focusedRow}
            tableScrollRef={tableScrollRef}
            format={format}
            paid={paid}
            total={order.total}
            productCatalog={productCatalog}
            allLabels={allLabels}
            onRowClick={(index) => { setFocusedRow(index); setFocusedPaymentRow(null); }}
          />

          <div className="order-detail__section order-detail__section--notes">
            <div className="order-detail__notes">
              <strong>{t('orders.detail.notes')}</strong>{' '}
              {order.notes ? order.notes : <span className="order-detail__notes--empty">{t('orders.detail.noNotes')}</span>}
            </div>
          </div>

          <OrderPaymentsTable
            payments={payments}
            items={order.items}
            focusedPaymentRow={focusedPaymentRow}
            editingPaymentId={editingPaymentId}
            editingPaymentValue={editingPaymentValue}
            role={role}
            status={order.status}
            archived={order.archived}
            paymentScrollRef={paymentScrollRef}
            format={format}
            createdBy={order.createdBy}
            deliveredBy={order.deliveredBy}
            onRowClick={(i) => { setFocusedPaymentRow(i); setFocusedRow(null); }}
            onEditStart={(id, amount) => { setEditingPaymentId(id); setEditingPaymentValue(String(amount)); }}
            onEditConfirm={handleUpdatePayment}
            onEditCancel={() => setEditingPaymentId(null)}
            onEditValueChange={setEditingPaymentValue}
          />
          </div>
        </div>

      </div>

      {showDeleteModal && (
        <OrderDeleteModal
          orderNumber={order?.orderNumber}
          confirmText={deleteConfirmText}
          onConfirmTextChange={setDeleteConfirmText}
          onConfirm={confirmDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          labels={allLabels}
          onClose={() => setSelectedProduct(null)}
        />
      )}
      {downloading && (
        <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -1 }}>
          <OrderCapture ref={captureRef} order={order} coverage={coverage} phoneCountryCode={clientData?.phoneCountryCode} downloadDate={downloadDate} businessName={user?.businessName} />
        </div>
      )}
    </MainLayout>
  );
};

export default OrderDetail;
