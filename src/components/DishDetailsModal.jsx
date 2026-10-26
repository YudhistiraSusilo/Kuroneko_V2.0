import { useEffect, useRef } from 'react';
import { formatRupiah } from '../utils/format.js';
import ImagePlaceholder from './ImagePlaceholder.jsx';
import { useLanguage } from './LanguageContext.jsx';
import useBodyScrollLock from '../utils/useBodyScrollLock.js';

export default function DishDetailsModal({ dish, onClose }) {
  const { t } = useLanguage();
  const closeButton = useRef(null);
  const dialog = useRef(null);

  useBodyScrollLock(true);

  useEffect(() => {
    closeButton.current?.focus();
    function closeOnEscape(event) {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const controls = dialog.current?.querySelectorAll('button');
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialog} className="menu-modal dish-details-modal" role="dialog" aria-modal="true" aria-labelledby="dish-details-title">
      <div className="modal-heading">
        <div><p className="eyebrow">{t('Dish details')}</p><h2 id="dish-details-title">{dish.name}</h2></div>
        <button ref={closeButton} className="modal-close" type="button" aria-label={t('Close dish details')} onClick={onClose}>×</button>
      </div>
      <ImagePlaceholder className="dish-details-picture" label={`${dish.name} image`} src={dish.picture} />
      <dl className="dish-details-meta">
        <div><dt>{t('Category')}</dt><dd>{t(dish.category)}</dd></div>
        <div><dt>{t('Price (IDR)')}</dt><dd>{formatRupiah(dish.price)}</dd></div>
        <div><dt>{t('Availability')}</dt><dd className={dish.available ? 'dish-details-available' : 'dish-details-unavailable'}>{t(dish.available ? 'Available' : 'Unavailable')}</dd></div>
      </dl>
      <div className="dish-details-description">
        <h3>{t('Description')}</h3>
        <p>{dish.description?.trim() || t('No description provided.')}</p>
      </div>
    </section>
  </div>;
}
