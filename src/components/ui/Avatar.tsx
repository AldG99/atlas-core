import { useState, useEffect } from 'react';

interface Props {
  src?: string | null;
  initials: string;
  alt?: string;
}

const Avatar = ({ src, initials, alt = '' }: Props) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return <img src={src} alt={alt} onError={() => setFailed(true)} />;
  }
  return <span>{initials}</span>;
};

export default Avatar;
