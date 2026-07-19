import { useState } from 'react';
import { generateAvatarUri } from '../../utils/avatar';

interface Props {
  src?: string | null;
  seed: string;
  alt?: string;
}

const Avatar = ({ src, seed, alt = '' }: Props) => {
  const [failed, setFailed] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);

  if (prevSrc !== src) {
    setPrevSrc(src);
    setFailed(false);
  }

  const resolvedSrc = src && !failed ? src : generateAvatarUri(seed);
  return <img src={resolvedSrc} alt={alt} onError={() => setFailed(true)} />;
};

export default Avatar;
