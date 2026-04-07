import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PiArrowCounterClockwiseBold } from 'react-icons/pi';
import { useTemplates } from '../../hooks/useTemplates';

type PlantillaKey = 'confirmacion' | 'preparacion' | 'entrega';

const PlantillasPanel = () => {
  const { t } = useTranslation();
  const {
    draft: plantillas,
    setDraft: setPlantillas,
    saving,
    isDirty,
    save,
    reset,
    resetToDefaults,
  } = useTemplates();
  const [plantillaTab, setPlantillaTab] = useState<PlantillaKey>('confirmacion');

  const PLANTILLA_TABS: { key: PlantillaKey; label: string }[] = [
    { key: 'confirmacion', label: t('settings.templates.tabConfirmation') },
    { key: 'preparacion',  label: t('settings.templates.tabPreparation') },
    { key: 'entrega',      label: t('settings.templates.tabDelivery') },
  ];

  return (
    <div className="configuracion__plantillas-panel">
      <p className="configuracion__desc">{t('settings.templates.desc')}</p>
      <p className="configuracion__note">{t('settings.templates.variables')}</p>
      <div className="configuracion__tabs">
        {PLANTILLA_TABS.map(tab => (
          <button
            key={tab.key}
            className={`configuracion__tab${plantillaTab === tab.key ? ' configuracion__tab--active' : ''}`}
            onClick={() => setPlantillaTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <textarea
        className="configuracion__textarea configuracion__textarea--grow"
        value={plantillas[plantillaTab]}
        onChange={e => setPlantillas(prev => ({ ...prev, [plantillaTab]: e.target.value }))}
        placeholder={t('settings.templates.placeholder')}
      />
      <div className="configuracion__actions">
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

export default PlantillasPanel;
