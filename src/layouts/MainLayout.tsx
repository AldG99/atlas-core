import { type ReactNode, useEffect, useRef } from 'react';
import Sidebar from '../components/ui/Sidebar';
import Header from '../components/ui/Header';
import InstallBanner from '../components/ui/InstallBanner';
import { useNotificaciones } from '../hooks/useNotificaciones';
import { usePWA } from '../hooks/usePWA';
import './MainLayout.scss';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { notificaciones } = useNotificaciones();
  const { notifPermission, sendNotification } = usePWA();
  const prevCountRef = useRef(notificaciones.length);

  // Enviar notificación del sistema cuando aparecen nuevas alertas
  useEffect(() => {
    if (notifPermission !== 'granted') return;
    const prev = prevCountRef.current;
    const curr = notificaciones.length;
    if (curr > prev) {
      const nueva = notificaciones[0];
      sendNotification(nueva.titulo, { body: nueva.descripcion });
    }
    prevCountRef.current = curr;
  }, [notificaciones, notifPermission, sendNotification]);

  return (
    <div className="main-layout">
      <Sidebar />
      <div className="main-layout__header">
        <Header />
      </div>
      <div className="main-layout__wrapper">
        <main className="main-layout__content">
          {children}
        </main>
      </div>
      <InstallBanner />
    </div>
  );
};

export default MainLayout;
