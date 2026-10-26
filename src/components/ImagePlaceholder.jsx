import { useEffect, useState } from 'react';

// Display a consistent, accessible stand-in until a real image is selected for production.
export default function ImagePlaceholder({ label, className = '', src = '' }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [src]);
  const hasImage = Boolean(src) && !imageFailed;
  return <div className={`image-placeholder ${hasImage ? 'has-image' : ''} ${className}`} role="img" aria-label={label}>
    {hasImage
      ? <img className="image-placeholder-photo" src={src} alt="" aria-hidden="true" onError={() => setImageFailed(true)} />
      : <><span className="image-placeholder-mark" lang="ja" aria-hidden="true">和</span><span className="image-placeholder-label">{label}</span></>}
  </div>;
}
