import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PiPlusBold, PiTrashBold, PiXBold } from 'react-icons/pi';
import type { Etiqueta } from '../../types/Producto';
import { ETIQUETA_ICONS, ETIQUETA_COLORES } from '../../constants/etiquetaIcons';

interface Props {
  etiquetas: Etiqueta[];
  selectedIds: string[];
  limiteAlcanzado: boolean;
  confirmDeleteId: string | null;
  maxEtiquetas: number;
  onToggle: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
  onCrear: (nombre: string, color: string, icono: string) => void;
}

const EtiquetaEditSection = ({
  etiquetas, selectedIds, limiteAlcanzado, confirmDeleteId, maxEtiquetas,
  onToggle, onDeleteRequest, onDeleteConfirm, onDeleteCancel, onCrear,
}: Props) => {
  const { t } = useTranslation();
  const [showNewForm, setShowNewForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState(ETIQUETA_COLORES[0]);
  const [icono, setIcono] = useState('star');

  const handleCrear = () => {
    const resolvedNombre = nombre.trim() || ETIQUETA_ICONS[icono]?.label || icono;
    onCrear(resolvedNombre, color, icono);
    setNombre('');
    setColor(ETIQUETA_COLORES[0]);
    setIcono('star');
    setShowNewForm(false);
  };

  return (
    <>
      {etiquetas.map(et => {
        const iconData = ETIQUETA_ICONS[et.icono];
        const Icon = iconData?.icon;
        const isSelected = selectedIds.includes(et.id);
        const isDisabled = !isSelected && limiteAlcanzado;
        return (
          <div key={et.id} className="producto-detail__etiqueta-wrapper">
            <span
              className={`producto-detail__etiqueta producto-detail__etiqueta--selectable ${isSelected ? '' : 'producto-detail__etiqueta--unselected'} ${isDisabled ? 'producto-detail__etiqueta--disabled' : ''}`}
              style={{ backgroundColor: isSelected ? et.color : undefined }}
              onClick={() => !isDisabled && onToggle(et.id)}
              title={et.nombre}
            >
              {Icon && <Icon size={12} />}
            </span>
            {confirmDeleteId === et.id ? (
              <div className="producto-detail__etiqueta-confirm">
                <button
                  type="button"
                  className="producto-detail__etiqueta-confirm-yes"
                  onClick={() => onDeleteConfirm(et.id)}
                >
                  {t('common.yes')}
                </button>
                <button
                  type="button"
                  className="producto-detail__etiqueta-confirm-no"
                  onClick={onDeleteCancel}
                >
                  {t('common.no')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="producto-detail__etiqueta-delete"
                onClick={() => onDeleteRequest(et.id)}
                title={t('products.modal.labelDelete')}
              >
                <PiTrashBold size={9} />
              </button>
            )}
          </div>
        );
      })}
      {limiteAlcanzado && (
        <span className="producto-detail__etiquetas-limite">
          {t('products.detail.labelsLimit', { max: maxEtiquetas })}
        </span>
      )}
      {!showNewForm ? (
        <button
          type="button"
          className="etiqueta-add-btn"
          onClick={() => setShowNewForm(true)}
        >
          <PiPlusBold size={12} />
          {t('products.modal.labelNew')}
        </button>
      ) : (
        <div className="etiqueta-new-form producto-detail__etiqueta-form">
          <div className="etiqueta-picker-row">
            <span className="etiqueta-picker-label">{t('products.modal.labelName')}</span>
            <input
              type="text"
              className="input etiqueta-nombre-input"
              placeholder={t('products.modal.labelNamePlaceholder')}
              value={nombre}
              onChange={e => setNombre(e.target.value)}
            />
          </div>
          <div className="etiqueta-picker-row">
            <span className="etiqueta-picker-label">{t('products.modal.labelIcon')}</span>
            <div className="etiqueta-icon-picker">
              {Object.entries(ETIQUETA_ICONS).map(([key, { icon: Icon, label }]) => (
                <button
                  key={key}
                  type="button"
                  className={`etiqueta-icon-swatch ${icono === key ? 'etiqueta-icon-swatch--active' : ''}`}
                  style={{ color }}
                  onClick={() => setIcono(key)}
                  title={label}
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>
          <div className="etiqueta-picker-row">
            <span className="etiqueta-picker-label">{t('products.modal.labelColor')}</span>
            <div className="etiqueta-color-picker">
              {ETIQUETA_COLORES.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`etiqueta-color-swatch ${color === c ? 'etiqueta-color-swatch--active' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="etiqueta-new-preview">
            {(() => {
              const Icon = ETIQUETA_ICONS[icono]?.icon;
              const previewName = nombre.trim() || ETIQUETA_ICONS[icono]?.label;
              return (
                <span className="etiqueta-chip" style={{ backgroundColor: color }}>
                  {Icon && <Icon size={12} />}
                  <span className="etiqueta-chip__label">{previewName}</span>
                </span>
              );
            })()}
          </div>
          <div className="etiqueta-new-form__actions">
            <button
              type="button"
              className="btn btn--sm btn--secondary"
              onClick={() => { setShowNewForm(false); setNombre(''); }}
            >
              <PiXBold size={12} />
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="btn btn--sm btn--primary"
              onClick={handleCrear}
            >
              {t('products.modal.labelCreate')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default EtiquetaEditSection;
