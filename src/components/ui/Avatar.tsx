import { useState } from 'react';

interface Props {
  src?: string | null;
  initials: string;
  alt?: string;
}

const Avatar = ({ src, initials, alt = '' }: Props) => {
  const [failed, setFailed] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);

  if (prevSrc !== src) {
    setPrevSrc(src);
    setFailed(false);
  }

  if (src && !failed) {
    return <img src={src} alt={alt} onError={() => setFailed(true)} />;
  }
  return <span>{initials}</span>;
};

export default Avatar;
