import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PiArrowCounterClockwiseBold } from 'react-icons/pi';
import { useTemplates } from '../../hooks/useTemplates';

type TemplateKey = 'confirmation' | 'preparing' | 'delivery';

const TemplatesPanel = () => {
  const { t } = useTranslation();
  const {
    draft: templates,
    setDraft: setTemplates,
    saving,
    isDirty,
    save,
    reset,
    resetToDefaults,
  } = useTemplates();
  const [templateTab, setTemplateTab] = useState<TemplateKey>('confirmation');

  const TEMPLATE_TABS: { key: TemplateKey; label: string }[] = [
    { key: 'confirmation', label: t('settings.templates.tabConfirmation') },
    { key: 'preparing',    label: t('settings.templates.tabPreparation') },
    { key: 'delivery',     label: t('settings.templates.tabDelivery') },
  ];

  return (
    <div className="settings__templates-panel">
      <p className="settings__desc">{t('settings.templates.desc')}</p>
      <p className="settings__note">{t('settings.templates.variables')}</p>
      <div className="settings__tabs">
        {TEMPLATE_TABS.map(tab => (
          <button
            key={tab.key}
            className={`settings__tab${templateTab === tab.key ? ' settings__tab--active' : ''}`}
            onClick={() => setTemplateTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <textarea
        className="settings__textarea settings__textarea--grow"
        value={templates[templateTab]}
        onChange={e => setTemplates(prev => ({ ...prev, [templateTab]: e.target.value }))}
        placeholder={t('settings.templates.placeholder')}
      />
      <div className="settings__actions">
        <button
          className="btn btn--outline btn--sm"
          onClick={resetToDefaults}
          title={t('settings.templates.restore')}
        >
          <PiArrowCounterClockwiseBold size={14} />
          {t('settings.templates.restore')}
        </button>
        <button
          className="btn btn--outline btn--sm"
          onClick={reset}
          disabled={!isDirty}
        >
          {t('settings.templates.cancel')}
        </button>
        <button
          className="btn btn--primary btn--sm"
          onClick={save}
          disabled={saving || !isDirty}
        >
          {saving ? t('settings.templates.saving') : t('settings.templates.save')}
        </button>
      </div>
    </div>
  );
};

export default TemplatesPanel;
