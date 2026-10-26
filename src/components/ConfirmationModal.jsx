import { useEffect, useRef } from 'react';
import { useLanguage } from './LanguageContext.jsx';
import useBodyScrollLock from '../utils/useBodyScrollLock.js';

export default function ConfirmationModal({ title, message, confirmLabel = 'Remove', className = '', onConfirm, onCancel }) {
  const { t } = useLanguage();
  const cancelButton = useRef(null);
  const dialog = useRef(null);

  useBodyScrollLock(true);

  useEffect(() => {
    cancelButton.current?.focus();
    function closeOnEscape(event) {
      if (event.key === 'Escape') onCancel();
      if (event.key !== 'Tab') return;
      const controls = dialog.current?.querySelectorAll('button:not(:disabled)');
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
  }, [onCancel]);

  return <div className="modal-backdrop confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
    <section ref={dialog} className={`confirm-card ${className}`} role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
      <span className="confirm-icon" aria-hidden="true">!</span>
      <p className="eyebrow">Please confirm</p>
      <h2 id="confirm-title">{title}</h2>
      <p className="confirm-message" id="confirm-message">{message}</p>
      <div className="confirm-actions">
        <button ref={cancelButton} className="button button-secondary" type="button" onClick={onCancel}>Cancel</button>
        <button className="button button-danger" type="button" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </section>
  </div>;
}
