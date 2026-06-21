import { useTranslation } from 'react-i18next';
import MainLayout from '../layouts/MainLayout';
import FaqPanel from '../components/ui/FaqPanel';
import './Faq.scss';

const Faq = () => {
  const { t } = useTranslation();

  return (
    <MainLayout>
      <div className="faq-page">
        <div className="faq-page__header">
          <h1>{t('support.faqTitle')}</h1>
          <p>{t('support.faqSubtitle')}</p>
        </div>
        <div className="faq-page__content">
          <FaqPanel />
        </div>
      </div>
    </MainLayout>
  );
};

export default Faq;
