import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PiPlusBold, PiTrashBold, PiXBold } from 'react-icons/pi';
import type { Label } from '../../types/Product';
import { LABEL_ICONS, LABEL_COLORS } from '../../constants/labelIcons';

interface Props {
  labels: Label[];
  selectedIds: string[];
  limitReached: boolean;
  confirmDeleteId: string | null;
  maxLabels: number;
  onToggle: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
  onCreate: (name: string, color: string, icon: string) => void;
}

const LabelEditSection = ({
  labels, selectedIds, limitReached, confirmDeleteId, maxLabels,
  onToggle, onDeleteRequest, onDeleteConfirm, onDeleteCancel, onCreate,
}: Props) => {
  const { t } = useTranslation();
  const [showNewForm, setShowNewForm] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(LABEL_COLORS[0]);
  const [icon, setIcon] = useState('star');

  const handleCreate = () => {
    const resolvedName = name.trim() || LABEL_ICONS[icon]?.label || icon;
    onCreate(resolvedName, color, icon);
    setName('');
    setColor(LABEL_COLORS[0]);
    setIcon('star');
    setShowNewForm(false);
  };

  return (
    <>
      {labels.map(label => {
        const iconData = LABEL_ICONS[label.icon];
        const Icon = iconData?.icon;
        const isSelected = selectedIds.includes(label.id);
        const isDisabled = !isSelected && limitReached;
        return (
          <div key={label.id} className="producto-detail__etiqueta-wrapper">
            <span
              className={`producto-detail__etiqueta producto-detail__etiqueta--selectable ${isSelected ? '' : 'producto-detail__etiqueta--unselected'} ${isDisabled ? 'producto-detail__etiqueta--disabled' : ''}`}
              style={{ backgroundColor: isSelected ? label.color : undefined }}
              onClick={() => !isDisabled && onToggle(label.id)}
              title={label.name}
            >
              {Icon && <Icon size={12} />}
            </span>
            {confirmDeleteId === label.id ? (
              <div className="producto-detail__etiqueta-confirm">
                <button
                  type="button"
                  className="producto-detail__etiqueta-confirm-yes"
                  onClick={() => onDeleteConfirm(label.id)}
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
                onClick={() => onDeleteRequest(label.id)}
                title={t('products.modal.labelDelete')}
              >
                <PiTrashBold size={9} />
              </button>
            )}
          </div>
        );
      })}
      {limitReached && (
        <span className="producto-detail__etiquetas-limite">
          {t('products.detail.labelsLimit', { max: maxLabels })}
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
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="etiqueta-picker-row">
            <span className="etiqueta-picker-label">{t('products.modal.labelIcon')}</span>
            <div className="etiqueta-icon-picker">
              {Object.entries(LABEL_ICONS).map(([key, { icon: Icon, label }]) => (
                <button
                  key={key}
                  type="button"
                  className={`etiqueta-icon-swatch ${icon === key ? 'etiqueta-icon-swatch--active' : ''}`}
                  style={{ color }}
                  onClick={() => setIcon(key)}
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
              {LABEL_COLORS.map(c => (
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
              const Icon = LABEL_ICONS[icon]?.icon;
              const previewName = name.trim() || LABEL_ICONS[icon]?.label;
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
              onClick={() => { setShowNewForm(false); setName(''); }}
            >
              <PiXBold size={12} />
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="btn btn--sm btn--primary"
              onClick={handleCreate}
            >
              {t('products.modal.labelCreate')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default LabelEditSection;
