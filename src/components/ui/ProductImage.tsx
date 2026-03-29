import { useState, useEffect } from 'react';
import { PiPackageBold } from 'react-icons/pi';

interface Props {
  src?: string | null;
  alt: string;
  placeholderClassName: string;
  placeholderSize?: number;
}

const ProductImage = ({ src, alt, placeholderClassName, placeholderSize = 48 }: Props) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return <img src={src} alt={alt} onError={() => setFailed(true)} />;
  }
  return (
    <div className={placeholderClassName}>
      <PiPackageBold size={placeholderSize} />
      <span>Sin imagen</span>
    </div>
  );
};

export default ProductImage;
