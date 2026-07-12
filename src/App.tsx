import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { OrdersProvider } from './context/OrdersContext';
import { ClientsProvider } from './context/ClientsContext';
import { ProductsProvider } from './context/ProductsContext';
import { LabelsProvider } from './context/LabelsContext';
import { ROUTES } from './config/routes';
import ProtectedRoute from './components/ui/ProtectedRoute';
import ErrorBoundary from './components/ui/ErrorBoundary';
import PageLoader from './components/ui/PageLoader';
import Toast from './components/ui/Toast';
import Maintenance from './pages/Maintenance';
import './styles/main.scss';

const MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

import Login from './pages/Login';
import Register from './pages/Register';

const Dashboard      = lazy(() => import('./pages/Dashboard'));
const NewOrder       = lazy(() => import('./pages/NewOrder'));
const OrderDetail    = lazy(() => import('./pages/OrderDetail'));
const Clients        = lazy(() => import('./pages/Clients'));
const ClientDetail   = lazy(() => import('./pages/ClientDetail'));
const Products       = lazy(() => import('./pages/Products'));
const ProductDetail  = lazy(() => import('./pages/ProductDetail'));
const Reports        = lazy(() => import('./pages/Reports'));
const Profile        = lazy(() => import('./pages/Profile'));
const Settings       = lazy(() => import('./pages/Settings'));
const Archive        = lazy(() => import('./pages/Archive'));
const Faq            = lazy(() => import('./pages/Faq'));
const Support        = lazy(() => import('./pages/Support'));
const Plans          = lazy(() => import('./pages/Plans'));
const Terms          = lazy(() => import('./pages/Terms'));
const Privacy        = lazy(() => import('./pages/Privacy'));
const NotFound       = lazy(() => import('./pages/NotFound'));

const PROTECTED_ROUTES = [
  { path: ROUTES.DASHBOARD,       component: Dashboard      },
  { path: ROUTES.NEW_ORDER,      component: NewOrder       },
  { path: ROUTES.ORDER_DETAIL,   component: OrderDetail    },
  { path: ROUTES.CLIENTS,        component: Clients        },
  { path: ROUTES.CLIENT_DETAIL,  component: ClientDetail   },
  { path: ROUTES.PRODUCTS,       component: Products       },
  { path: ROUTES.PRODUCT_DETAIL, component: ProductDetail  },
  { path: ROUTES.REPORTS,        component: Reports        },
  { path: ROUTES.ARCHIVE,         component: Archive        },
  { path: ROUTES.PROFILE,          component: Profile        },
  { path: ROUTES.SETTINGS,   component: Settings       },
  { path: ROUTES.FAQ,             component: Faq            },
  { path: ROUTES.SUPPORT,         component: Support        },
  { path: ROUTES.PLANS,          component: Plans          },
] as const;

function App() {
  if (MAINTENANCE_MODE) {
    return <Maintenance />;
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <OrdersProvider>
          <ClientsProvider>
          <ProductsProvider>
          <LabelsProvider>
          <ToastProvider>
            <Toast />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path={ROUTES.REGISTER}   element={<Register />} />
                <Route path={ROUTES.TERMS}   element={<Terms />} />
                <Route path={ROUTES.PRIVACY} element={<Privacy />} />

                {PROTECTED_ROUTES.map(({ path, component: Component }) => (
                  <Route
                    key={path}
                    path={path}
                    element={<ProtectedRoute><Component /></ProtectedRoute>}
                  />
                ))}

                <Route path={ROUTES.HOME} element={<Login />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ToastProvider>
          </LabelsProvider>
          </ProductsProvider>
          </ClientsProvider>
          </OrdersProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
