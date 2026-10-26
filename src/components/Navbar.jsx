import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import ImagePlaceholder from './ImagePlaceholder.jsx';
import { LanguageSelect, useLanguage } from './LanguageContext.jsx';
import kuroNekoLogo from '../assets/kuroneko-logo.png';

export default function Navbar({ user, cart = [] }) {
  const location = useLocation();
  const { t } = useLanguage();
  const [scrolledSection, setScrolledSection] = useState('');
  const sectionScrollTarget = useRef('');
  const cartCount = cart.reduce((count, item) => count + (Number(item.quantity) || 0), 0);
  const links = user.role === 'administrator'
    ? [{ to: '/dashboard', label: 'Dashboard' }, { to: '/orders', label: 'Orders' }, { to: '/menu', label: 'Manage menu', pageLink: true }]
    : [
      { to: '/dashboard?section=home', label: 'Home', section: 'home' },
      { to: '/dashboard?section=about', label: 'About', section: 'about' },
      { to: '/dashboard?section=branches', label: 'Branches', section: 'branches' },
      { to: '/dashboard?section=contact', label: 'Contact', section: 'contact' },
      { to: '/menu', label: 'Menu', pageLink: true },
    ];
  const currentSection = scrolledSection || new URLSearchParams(location.search).get('section') || 'home';

  useLayoutEffect(() => {
    const section = new URLSearchParams(location.search).get('section') || '';
    sectionScrollTarget.current = ['home', 'about', 'branches', 'contact'].includes(section) ? section : '';
    setScrolledSection(section);
  }, [location.pathname, location.search]);

  useEffect(() => {
    function updateSection(event) {
      if (sectionScrollTarget.current && event.detail !== sectionScrollTarget.current) return;
      sectionScrollTarget.current = '';
      setScrolledSection(event.detail);
    }
    function releaseSectionTarget() {
      sectionScrollTarget.current = '';
    }
    function releaseTargetOnKeyboardScroll(event) {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) {
        releaseSectionTarget();
      }
    }
    window.addEventListener('kuroneko:home-section-change', updateSection);
    window.addEventListener('wheel', releaseSectionTarget, { passive: true });
    window.addEventListener('touchstart', releaseSectionTarget, { passive: true });
    window.addEventListener('keydown', releaseTargetOnKeyboardScroll);
    return () => {
      window.removeEventListener('kuroneko:home-section-change', updateSection);
      window.removeEventListener('wheel', releaseSectionTarget);
      window.removeEventListener('touchstart', releaseSectionTarget);
      window.removeEventListener('keydown', releaseTargetOnKeyboardScroll);
    };
  }, []);

  return <header className="navbar">
    <div className="navbar-inner">
      <Link className="brand" to="/dashboard" aria-label={t('Kuro Neko dashboard')}>
        <img className="brand-logo-image" src={kuroNekoLogo} alt="" aria-hidden="true" /><span className="brand-wordmark"><strong>KURO NEKO</strong></span>
      </Link>
      <nav className="nav-links" aria-label="Main navigation">
        {links.map((link) => link.section
          ? <Link key={link.section} className={location.pathname === '/dashboard' && currentSection === link.section ? 'active' : ''} to={link.to} onClick={() => { sectionScrollTarget.current = link.section; setScrolledSection(link.section); }}>{t(link.label)}</Link>
          : <NavLink key={link.to} to={link.to} className={({ isActive }) => `${isActive ? 'active' : ''} ${link.pageLink ? 'nav-page-link' : ''}`.trim()}>{t(link.label)}{link.pageLink && <span className="nav-page-indicator" aria-hidden="true">↗</span>}</NavLink>)}
      </nav>
      <div className="nav-user">
        <LanguageSelect />
        {user.role === 'client' && <NavLink className="cart-icon-link" to="/cart" aria-label={t('Open cart')} title={t('Cart')}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></svg>
          {cartCount > 0 && <span className="cart-count-badge" aria-label={`${cartCount} items in cart`}>{cartCount > 99 ? '99+' : cartCount}</span>}
        </NavLink>}
        <NavLink className="profile-link" to="/profile" aria-label={t('Profile')}>
          <div className="avatar avatar-small"><ImagePlaceholder className="avatar-image-placeholder" label="Profile picture" src={user.profilePicture} /></div>
          <span className="user-name">{user.displayName}</span>
        </NavLink>
      </div>
    </div>
  </header>;
}
