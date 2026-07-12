import { type ReactNode, useState, useEffect, useRef } from 'react';
import Sidebar from '../components/ui/Sidebar';
import Header from '../components/ui/Header';
import BottomNav from '../components/ui/BottomNav';
import InstallBanner from '../components/ui/InstallBanner';
import { useNotifications } from '../hooks/useNotifications';
import { usePWA } from '../hooks/usePWA';
import './MainLayout.scss';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { notifications } = useNotifications();
  const { notifPermission, sendNotification } = usePWA();
  const prevCountRef = useRef(notifications.length);

  // Enviar notificación del sistema cuando aparecen nuevas alertas
  useEffect(() => {
    if (notifPermission !== 'granted') return;
    const prev = prevCountRef.current;
    const curr = notifications.length;
    if (curr > prev) {
      const newest = notifications[0];
      sendNotification(newest.title, { body: newest.description });
    }
    prevCountRef.current = curr;
  }, [notifications, notifPermission, sendNotification]);

  return (
    <div className="main-layout">
      <Sidebar
        isMobileOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(prev => !prev)}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="main-layout__header">
        <Header notifications={notifications} />
      </div>
      <div className="main-layout__wrapper">
        <main className="main-layout__content">
          {children}
        </main>
      </div>
      <BottomNav onOpenMenu={() => setIsSidebarOpen(prev => !prev)} />
      <InstallBanner />
    </div>
  );
};

export default MainLayout;
