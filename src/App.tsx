import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ROUTES } from './config/routes';
import ProtectedRoute from './components/ui/ProtectedRoute';
import Toast from './components/ui/Toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewPedido from './pages/NewPedido';
import PedidoDetail from './pages/PedidoDetail';
import Clientes from './pages/Clientes';
import ClienteDetail from './pages/ClienteDetail';
import Productos from './pages/Productos';
import ProductoDetail from './pages/ProductoDetail';
import Reportes from './pages/Reportes';
import Perfil from './pages/Perfil';
import Configuracion from './pages/Configuracion';
import Archivo from './pages/Archivo';
import Soporte from './pages/Soporte';
import Planes from './pages/Planes';
import Terminos from './pages/Terminos';
import Privacidad from './pages/Privacidad';
import NotFound from './pages/NotFound';
import './styles/main.scss';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Toast />
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
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
