import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PiPackageBold } from 'react-icons/pi';

interface Props {
  src?: string | null;
  alt: string;
  placeholderClassName: string;
  placeholderSize?: number;
}

const ProductImage = ({ src, alt, placeholderClassName, placeholderSize = 48 }: Props) => {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);

  if (prevSrc !== src) {
    setPrevSrc(src);
    setFailed(false);
  }

  if (src && !failed) {
    return <img src={src} alt={alt} onError={() => setFailed(true)} />;
  }
  return (
    <div className={placeholderClassName}>
      <PiPackageBold size={placeholderSize} />
      <span>{t('common.noImage')}</span>
    </div>
  );
};

export default ProductImage;
