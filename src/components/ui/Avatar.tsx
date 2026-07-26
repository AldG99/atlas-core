import { useState } from 'react';
import type { CSSProperties } from 'react';
import { generateAvatarUri, getAvatarColor } from '../../utils/avatar';

const initialsStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

interface Props {
  src?: string | null;
  seed: string;
  alt?: string;
  initials?: string;
}

const Avatar = ({ src, seed, alt = '', initials }: Props) => {
  const [failed, setFailed] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);

  if (prevSrc !== src) {
    setPrevSrc(src);
    setFailed(false);
  }

  if (initials && (!src || failed)) {
    return (
      <span style={{ ...initialsStyle, backgroundColor: getAvatarColor(seed) }}>
        {initials}
      </span>
    );
  }

  const resolvedSrc = src && !failed ? src : generateAvatarUri(seed);
  return <img src={resolvedSrc} alt={alt} onError={() => setFailed(true)} />;
};

export default Avatar;
