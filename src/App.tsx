import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ROUTES } from './config/routes';
import ProtectedRoute from './components/ui/ProtectedRoute';
import ErrorBoundary from './components/ui/ErrorBoundary';
import PageLoader from './components/ui/PageLoader';
import Toast from './components/ui/Toast';
import './styles/main.scss';

import Login from './pages/Login';
import Register from './pages/Register';

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

const PROTECTED_ROUTES = [
  { path: ROUTES.DASHBOARD,       component: Dashboard      },
  { path: ROUTES.NEW_PEDIDO,      component: NewPedido      },
  { path: ROUTES.DETAIL_PEDIDO,   component: PedidoDetail   },
  { path: ROUTES.CLIENTES,        component: Clientes       },
  { path: ROUTES.DETAIL_CLIENTE,  component: ClienteDetail  },
  { path: ROUTES.PRODUCTOS,       component: Productos      },
  { path: ROUTES.DETAIL_PRODUCTO, component: ProductoDetail },
  { path: ROUTES.REPORTES,        component: Reportes       },
  { path: ROUTES.ARCHIVO,         component: Archivo        },
  { path: ROUTES.PERFIL,          component: Perfil         },
  { path: ROUTES.CONFIGURACION,   component: Configuracion  },
  { path: ROUTES.SOPORTE,         component: Soporte        },
  { path: ROUTES.PLANES,          component: Planes         },
] as const;

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Toast />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path={ROUTES.LOGIN}      element={<Login />} />
                <Route path={ROUTES.REGISTER}   element={<Register />} />
                <Route path={ROUTES.TERMINOS}   element={<Terminos />} />
                <Route path={ROUTES.PRIVACIDAD} element={<Privacidad />} />

                {PROTECTED_ROUTES.map(({ path, component: Component }) => (
                  <Route
                    key={path}
                    path={path}
                    element={<ProtectedRoute><Component /></ProtectedRoute>}
                  />
                ))}

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
