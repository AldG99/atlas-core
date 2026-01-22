import type { ReactNode } from 'react';
import Sidebar from '../components/ui/Sidebar';
import Header from '../components/ui/Header';
import './MainLayout.scss';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
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
    </div>
  );
};

export default MainLayout;
