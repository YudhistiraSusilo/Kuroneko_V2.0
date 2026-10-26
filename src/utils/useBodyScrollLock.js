import { useEffect } from 'react';

// Keep the page behind an open modal from scrolling.
let activeLocks = 0;
let savedOverflow = '';
let savedPaddingRight = '';

export default function useBodyScrollLock(isOpen) {
  useEffect(() => {
    if (!isOpen) return undefined;

    if (activeLocks === 0) {
      savedOverflow = document.body.style.overflow;
      savedPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    activeLocks += 1;
    return () => {
      activeLocks -= 1;
      if (activeLocks === 0) {
        document.body.style.overflow = savedOverflow;
        document.body.style.paddingRight = savedPaddingRight;
      }
    };
  }, [isOpen]);
}
