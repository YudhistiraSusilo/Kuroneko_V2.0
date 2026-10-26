import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const cardSelectors = ['.order-card', '.signature-card', '.dish-card', '.branch-cards article', '.account-section', '.saved-address-card', '.favorite-menu-card', '.summary-card'];
const cardSelector = cardSelectors.join(', ');
const dividerSelector = '.signature-rule';
const sectionSelector = [
  '.page-heading', '.section-heading', '.signature-heading', '.story-layout > div:first-child',
  '.story-layout > .interior-placeholder',
  '.branch-heading-line', '.branch-japanese', '.contact-layout > div',
  '.footer-column', '.footer-copyright', '.menu-page-heading-plain',
  '.menu-discovery', '.menu-admin-toolbar', '.menu-results-heading',
  '.menu-pagination', '.client-hero-copy > .hero-description',
  '.client-hero-copy > .hero-japanese', '.client-hero-copy > .hero-menu-link',
].join(', ');
const staggerSelector = `${cardSelector}, ${sectionSelector}`;
const motionSelector = `${staggerSelector}, ${dividerSelector}`;

export default function ScrollMotion() {
  const { pathname } = useLocation();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) return undefined;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('scroll-motion-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -80px 0px' });
    const observed = new WeakSet();

    function observeElement(element) {
      if (!(element instanceof HTMLElement) || observed.has(element) || !element.matches(motionSelector)) return;
      observed.add(element);
      const isDivider = element.matches(dividerSelector);
      const isCard = cardSelectors.some((selector) => element.matches(selector));
      element.classList.add(isDivider ? 'divider-motion' : isCard ? 'card-motion' : 'section-motion');
      if (!isDivider) {
        const siblings = [...element.parentElement.children].filter((sibling) => sibling.matches(staggerSelector));
        const siblingIndex = Math.max(0, siblings.indexOf(element));
        const isMenuOrProfileCard = element.matches('.dish-card, .account-section, .saved-address-card, .favorite-menu-card');
        const staggerStep = isMenuOrProfileCard ? 50 : 120;
        element.style.setProperty('--motion-delay', `${Math.min(siblingIndex, 4) * staggerStep}ms`);
      }
      observer.observe(element);
    }

    function observeTree(node) {
      if (!(node instanceof HTMLElement)) return;
      observeElement(node);
      node.querySelectorAll(motionSelector).forEach(observeElement);
    }

    // Observe the current route immediately and watch for loading lists that
    // render their cards shortly after the page appears.
    observeTree(document.body);
    document.documentElement.classList.add('scroll-motion-enabled');
    const contentObserver = typeof MutationObserver === 'undefined' ? null : new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach(observeTree));
    });
    contentObserver?.observe(document.body, { childList: true, subtree: true });

    return () => {
      contentObserver?.disconnect();
      observer.disconnect();
      document.documentElement.classList.remove('scroll-motion-enabled');
    };
  }, [pathname]);

  return null;
}
