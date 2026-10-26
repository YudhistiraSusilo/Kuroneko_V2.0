import { Link, useLocation } from 'react-router-dom';
import ImagePlaceholder from '../ImagePlaceholder.jsx';
import profileSidebarBackground from '../../../menu pictures/profile banner_background.png';

export default function ProfileSidebar({ t, user, email, profilePicture, isClient, activeSection, onScrollToSection, onLogout }) {
  const location = useLocation();

  return <aside className="account-sidebar">
    <ImagePlaceholder className="profile-sidebar-art" label="KuroNeko profile background" src={profileSidebarBackground} />
    <div className="sidebar-profile">
      <div className="avatar avatar-large"><ImagePlaceholder className="profile-image-placeholder" label="Profile picture" src={profilePicture} /></div>
      <strong>{user.displayName}</strong><span>{email}</span>
    </div>
    <nav className="account-section-nav" aria-label="Account sections">
      <button className={activeSection === 'personal-information' ? 'selected' : ''} type="button" onClick={() => onScrollToSection('personal-information')}>♟ <span>{t('Profile')}</span></button>
      {isClient && <>
        <button className={activeSection === 'saved-addresses' ? 'selected' : ''} type="button" onClick={() => onScrollToSection('saved-addresses')}>⌖ <span>{t('Addresses')}</span></button>
        <button className={activeSection === 'favorite-menu' ? 'selected' : ''} type="button" onClick={() => onScrollToSection('favorite-menu')}>♡ <span>{t('Saved Items')}</span></button>
        <Link className={location.pathname === '/orders' ? 'selected' : ''} to="/orders">▤ <span>{t('Order History')}</span><span className="account-nav-link-arrow" aria-hidden="true">↗</span></Link>
      </>}
    </nav>
    <button className="account-sidebar-logout" type="button" onClick={onLogout}>{t('Log out')}</button>
  </aside>;
}
