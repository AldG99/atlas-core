import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ROUTES } from './config/routes';
import ProtectedRoute from './components/ui/ProtectedRoute';
import ErrorBoundary from './components/ui/ErrorBoundary';
import Toast from './components/ui/Toast';
import './styles/main.scss';

// Páginas cargadas de forma síncrona (rutas de auth — necesarias al inicio)
import Login from './pages/Login';
import Register from './pages/Register';

// Páginas cargadas de forma lazy (se descargan solo cuando se navega a ellas)
const Dashboard      = lazy(() => import('./pages/Dashboard'));
const NewPedido      = lazy(() => import('./pages/NewPedido'));
const PedidoDetail   = lazy(() => import('./pages/PedidoDetail'));
const Clientes       = lazy(() => import('./pages/Clientes'));
const ClienteDetail  = lazy(() => import('./pages/ClienteDetail'));
const Productos      = lazy(() => import('./pages/Productos'));
const ProductoDetail = lazy(() => import('./pages/ProductoDetail'));
const Reportes       = lazy(() => import('./pages/Reportes'));
const Perfil         = lazy(() => import('./pages/Perfil'));
const Configuracion  = lazy(() => import('./pages/Configuracion'));
const Archivo        = lazy(() => import('./pages/Archivo'));
const Soporte        = lazy(() => import('./pages/Soporte'));
const Planes         = lazy(() => import('./pages/Planes'));
const Terminos       = lazy(() => import('./pages/Terminos'));
const Privacidad     = lazy(() => import('./pages/Privacidad'));
const NotFound       = lazy(() => import('./pages/NotFound'));

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid var(--color-border, #e5e7eb)',
        borderTopColor: 'var(--color-primary, #3b82f6)',
        animation: 'spin 0.7s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Toast />
          <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.REGISTER} element={<Register />} />
          <Route
            path={ROUTES.DASHBOARD}
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.NEW_PEDIDO}
            element={
              <ProtectedRoute>
                <NewPedido />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.DETAIL_PEDIDO}
            element={
              <ProtectedRoute>
                <PedidoDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.CLIENTES}
            element={
              <ProtectedRoute>
                <Clientes />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.DETAIL_CLIENTE}
            element={
              <ProtectedRoute>
                <ClienteDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.PRODUCTOS}
            element={
              <ProtectedRoute>
                <Productos />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.DETAIL_PRODUCTO}
            element={
              <ProtectedRoute>
                <ProductoDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.REPORTES}
            element={
              <ProtectedRoute>
                <Reportes />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ARCHIVO}
            element={
              <ProtectedRoute>
                <Archivo />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.PERFIL}
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.CONFIGURACION}
            element={
              <ProtectedRoute>
                <Configuracion />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.SOPORTE}
            element={
              <ProtectedRoute>
                <Soporte />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.PLANES}
            element={
              <ProtectedRoute>
                <Planes />
              </ProtectedRoute>
            }
          />
          <Route path={ROUTES.TERMINOS} element={<Terminos />} />
          <Route path={ROUTES.PRIVACIDAD} element={<Privacidad />} />
          <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
