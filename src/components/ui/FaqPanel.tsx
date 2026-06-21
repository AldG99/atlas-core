import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PiCaretDownBold } from 'react-icons/pi';
import './FaqPanel.scss';

const FaqPanel = () => {
  const { t } = useTranslation();
  const faqData = t('support.faq', { returnObjects: true }) as { question: string; answer: string }[];
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="faq-panel">
      {faqData.map((item, i) => (
        <div
          key={i}
          className={`faq-panel__item${open === i ? ' faq-panel__item--open' : ''}`}
        >
          <button
            className="faq-panel__question"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span>{item.question}</span>
            <PiCaretDownBold size={15} className="faq-panel__icon" />
          </button>
          <div className="faq-panel__answer">
            <p>{item.answer}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FaqPanel;
