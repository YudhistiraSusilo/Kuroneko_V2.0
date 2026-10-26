import { useEffect, useMemo, useRef, useState } from 'react';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import ProfileSidebar from '../components/profile/ProfileSidebar.jsx';
import PersonalInformationSection from '../components/profile/PersonalInformationSection.jsx';
import SecurityInformationSection from '../components/profile/SecurityInformationSection.jsx';
import SavedAddressesSection from '../components/profile/SavedAddressesSection.jsx';
import RecentOrderSection from '../components/profile/RecentOrderSection.jsx';
import FavoriteMenuSection from '../components/profile/FavoriteMenuSection.jsx';
import { filterOrders } from '../utils/orderHelpers.js';
import { useLanguage } from '../components/LanguageContext.jsx';

const emptyAddress = { label: '', recipient: '', phone: '', address: '' };

export default function ProfilePage({ user, onSave, onLogout, orders, onCancelOrder, menu = [], onToggleFavorite, onAddToCart }) {
  const { t, language } = useLanguage();
  const isClient = user.role === 'client';
  const [fullName, setFullName] = useState(user.displayName || '');
  const [email, setEmail] = useState(user.email || `${user.username}@example.com`);
  const [phone, setPhone] = useState(user.phone || '+62 812 3456 7890');
  const [profilePicture, setProfilePicture] = useState(user.profilePicture || '');
  const [editingPersonalInfo, setEditingPersonalInfo] = useState(false);
  const [personalError, setPersonalError] = useState('');
  const [personalSuccess, setPersonalSuccess] = useState('');
  const [savingPersonalInfo, setSavingPersonalInfo] = useState(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);
  const [pendingFavoriteRemoval, setPendingFavoriteRemoval] = useState(null);
  const pendingClick = useRef(null);
  const allowNextClick = useRef(false);
  const [showPassword, setShowPassword] = useState(false);
  const [addresses, setAddresses] = useState(Array.isArray(user.addresses) ? user.addresses : []);
  const [defaultAddressId, setDefaultAddressId] = useState(() => {
    const savedAddresses = Array.isArray(user.addresses) ? user.addresses : [];
    return user.defaultAddressId || savedAddresses.find((address) => address.isDefault)?.id || savedAddresses[0]?.id || '';
  });
  const [addressPage, setAddressPage] = useState(1);
  const [addressDraft, setAddressDraft] = useState(emptyAddress);
  const [editingAddressId, setEditingAddressId] = useState('');
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [addressSuccess, setAddressSuccess] = useState('');
  const [activeSection, setActiveSection] = useState('personal-information');
  const [favoritePage, setFavoritePage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState('');
  const favoriteItems = useMemo(() => Array.isArray(menu)
    ? menu.filter((item) => (Array.isArray(user.favoriteMenuIds) ? user.favoriteMenuIds : []).includes(item.id))
    : [], [menu, user.favoriteMenuIds]);
  const favoritePageSize = 6;
  const addressPageSize = 2;
  const addressPageCount = Math.max(1, Math.ceil(addresses.length / addressPageSize));
  const currentAddressPage = Math.min(addressPage, addressPageCount);
  const visibleAddresses = addresses.slice((currentAddressPage - 1) * addressPageSize, currentAddressPage * addressPageSize);
  const mainAddressId = addresses.some((address) => address.id === defaultAddressId) ? defaultAddressId : addresses[0]?.id || '';
  const favoritePageCount = Math.max(1, Math.ceil(favoriteItems.length / favoritePageSize));
  const currentFavoritePage = Math.min(favoritePage, favoritePageCount);
  const visibleFavoriteItems = favoriteItems.slice((currentFavoritePage - 1) * favoritePageSize, currentFavoritePage * favoritePageSize);
  const accountOrders = useMemo(() => filterOrders(orders, { clientId: user.id }), [orders, user.id]);
  const editingAddress = addresses.find((address) => address.id === editingAddressId);
  const hasUnsavedAddressChanges = addressFormOpen && (editingAddress
    ? ['label', 'recipient', 'phone', 'address'].some((field) => addressDraft[field] !== editingAddress[field])
    : Object.values(addressDraft).some((value) => value.trim()));
  const hasUnsavedPersonalChanges = editingPersonalInfo && !savingPersonalInfo && (
    fullName !== (user.displayName || '')
    || email !== (user.email || `${user.username}@example.com`)
    || phone !== (user.phone || '+62 812 3456 7890')
    || profilePicture !== (user.profilePicture || '')
  );
  const hasUnsavedChanges = hasUnsavedPersonalChanges || hasUnsavedAddressChanges;

  useEffect(() => {
    setFavoritePage(1);
  }, [favoriteItems]);

  useEffect(() => {
    setPageError('');
    const timer = window.setTimeout(() => {
      if (!Array.isArray(orders) || !Array.isArray(menu)) setPageError('Account information could not be loaded. Please refresh the page.');
      setLoading(false);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [orders, menu]);

  useEffect(() => {
    if (!addressSuccess) return undefined;
    const timer = window.setTimeout(() => setAddressSuccess(''), 3500);
    return () => window.clearTimeout(timer);
  }, [addressSuccess]);

  useEffect(() => {
    if (!personalSuccess) return undefined;
    const timer = window.setTimeout(() => setPersonalSuccess(''), 3500);
    return () => window.clearTimeout(timer);
  }, [personalSuccess]);

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;
    function warnBeforeLeaving(event) {
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;
    function confirmBeforeAction(event) {
      if (allowNextClick.current) {
        allowNextClick.current = false;
        return;
      }
      if (event.target.closest('.confirm-backdrop')) return;
      const target = event.target.closest('a, button');
      if (!target || target.disabled) return;
      // Buttons inside forms default to submit even without an explicit type.
      // Let form submission reach its handler so Save changes works normally.
      if (target.closest('form') && target.type === 'submit') return;
      if (target.closest('.personal-info-form .picture-picker')) return;
      event.preventDefault();
      event.stopPropagation();
      pendingClick.current = target;
      setShowUnsavedPrompt(true);
    }
    document.addEventListener('click', confirmBeforeAction, true);
    return () => document.removeEventListener('click', confirmBeforeAction, true);
  }, [hasUnsavedChanges]);

  function scrollToSection(sectionId) {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function choosePicture(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPersonalError('Choose an image file for your profile picture.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPersonalError('Choose an image smaller than 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { setProfilePicture(reader.result); setPersonalError(''); };
    reader.onerror = () => setPersonalError('The picture could not be read. Please choose it again.');
    reader.readAsDataURL(file);
  }

  function savePersonalInfo(event) {
    event.preventDefault();
    setPersonalError('');
    setPersonalSuccess('');
    if (fullName.trim().length < 2 || fullName.trim().length > 60) {
      setPersonalError('Enter a name between 2 and 60 characters.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setPersonalError('Enter a valid email address.');
      return;
    }
    if (phone.trim().length < 7 || phone.trim().length > 24) {
      setPersonalError('Enter a phone number between 7 and 24 characters.');
      return;
    }
    setSavingPersonalInfo(true);
    window.setTimeout(() => {
      onSave({ displayName: fullName.trim(), email: email.trim(), phone: phone.trim(), profilePicture });
      setSavingPersonalInfo(false);
      setEditingPersonalInfo(false);
      setPersonalSuccess('Personal information saved.');
    }, 300);
  }

  function discardPersonalChanges() {
    setFullName(user.displayName || '');
    setEmail(user.email || `${user.username}@example.com`);
    setPhone(user.phone || '+62 812 3456 7890');
    setProfilePicture(user.profilePicture || '');
    setPersonalError('');
    setEditingPersonalInfo(false);
    setAddressDraft(emptyAddress);
    setEditingAddressId('');
    setAddressFormOpen(false);
    setShowUnsavedPrompt(false);
    const clickedElement = pendingClick.current;
    pendingClick.current = null;
    const isCancelButton = clickedElement?.matches('.account-edit-button, .address-edit-form button[type="button"]');
    window.setTimeout(() => {
      if (!clickedElement?.isConnected) return;
      if (isCancelButton) return;
      allowNextClick.current = true;
      clickedElement.click();
      allowNextClick.current = false;
    }, 0);
  }

  function requestFavoriteRemoval(item) {
    setPendingFavoriteRemoval(item);
  }

  function confirmFavoriteRemoval() {
    if (pendingFavoriteRemoval) onToggleFavorite(pendingFavoriteRemoval.id);
    setPendingFavoriteRemoval(null);
  }

  function updateAddressField(event) {
    setAddressDraft((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function startAddressEdit(address) {
    setAddressDraft({ label: address.label, recipient: address.recipient, phone: address.phone, address: address.address });
    setEditingAddressId(address.id);
    setAddressError('');
    setAddressFormOpen(true);
  }

  function cancelAddressEdit() {
    setAddressDraft(emptyAddress);
    setEditingAddressId('');
    setAddressError('');
    setAddressFormOpen(false);
  }

  function saveAddress(event) {
    event.preventDefault();
    setAddressError('');
    if (addressDraft.label.trim().length < 2 || addressDraft.recipient.trim().length < 2 || addressDraft.phone.trim().length < 7 || addressDraft.address.trim().length < 8) {
      setAddressError('Complete each field. Use at least 2 characters for the label and recipient, 7 for the phone, and 8 for the address.');
      return;
    }
    const savedAddress = { ...addressDraft, id: editingAddressId || `address-${Date.now()}` };
    const nextAddresses = editingAddressId
      ? addresses.map((item) => item.id === editingAddressId ? savedAddress : item)
      : [...addresses, savedAddress];
    setAddresses(nextAddresses);
    if (!editingAddressId) setAddressPage(Math.ceil(nextAddresses.length / addressPageSize));
    const nextDefaultAddressId = defaultAddressId || savedAddress.id;
    setDefaultAddressId(nextDefaultAddressId);
    onSave({ addresses: nextAddresses, defaultAddressId: nextDefaultAddressId });
    setAddressSuccess(editingAddressId ? 'Address updated.' : 'Address saved.');
    cancelAddressEdit();
  }

  function removeAddress(addressId) {
    const nextAddresses = addresses.filter((item) => item.id !== addressId);
    setAddresses(nextAddresses);
    setAddressPage(Math.min(currentAddressPage, Math.max(1, Math.ceil(nextAddresses.length / addressPageSize))));
    const nextDefaultAddressId = mainAddressId === addressId ? nextAddresses[0]?.id || '' : mainAddressId;
    setDefaultAddressId(nextDefaultAddressId);
    onSave({ addresses: nextAddresses, defaultAddressId: nextDefaultAddressId });
    setAddressSuccess('Address removed.');
  }

  function setMainAddress(addressId) {
    setDefaultAddressId(addressId);
    onSave({ defaultAddressId: addressId });
    setAddressSuccess('Main address updated.');
  }

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '15 Jan, 2025';

  return <section className="profile-page account-page">
    {showUnsavedPrompt && <ConfirmationModal
      className="unsaved-changes-confirmation"
      title={t('Discard unsaved changes?')}
      message={t('Your profile has unsaved changes. Do you want to discard them?')}
      confirmLabel={t('Discard changes')}
      onConfirm={discardPersonalChanges}
      onCancel={() => { setShowUnsavedPrompt(false); pendingClick.current = null; }}
    />}
    {pendingFavoriteRemoval && <ConfirmationModal
      className="favorite-removal-confirmation"
      title={t('Remove this dish from saved items?')}
      message={t('{dish} will be removed from your saved items.', { dish: pendingFavoriteRemoval.name })}
      confirmLabel={t('Remove from favorites')}
      onConfirm={confirmFavoriteRemoval}
      onCancel={() => setPendingFavoriteRemoval(null)}
    />}
    <header className="account-page-heading"><div><h1>{t('My Account')}</h1>{language !== 'ja' && <p className="eyebrow account-page-japanese" lang="ja">マイアカウント</p>}</div></header>
    <div className="account-page-layout">
      <ProfileSidebar t={t} user={user} email={email} profilePicture={profilePicture} isClient={isClient} activeSection={activeSection} onScrollToSection={scrollToSection} onLogout={onLogout} />

      <div className="account-content">
        <PersonalInformationSection
          t={t} user={user} memberSince={memberSince} email={email} phone={phone}
          editing={editingPersonalInfo}
          onToggleEdit={() => { setEditingPersonalInfo((editing) => !editing); setPersonalError(''); setPersonalSuccess(''); }}
          fullName={fullName} onFullNameChange={(event) => setFullName(event.target.value)}
          onEmailChange={(event) => setEmail(event.target.value)} onPhoneChange={(event) => setPhone(event.target.value)}
          onChoosePicture={choosePicture} error={personalError} saving={savingPersonalInfo}
          onSave={savePersonalInfo} success={personalSuccess}
        />
        <SecurityInformationSection t={t} user={user} showPassword={showPassword} onTogglePassword={() => setShowPassword((shown) => !shown)} />

        {isClient && <SavedAddressesSection
          t={t} addresses={addresses} visibleAddresses={visibleAddresses} addressFormOpen={addressFormOpen}
          addressPageSize={addressPageSize} currentAddressPage={currentAddressPage} addressPageCount={addressPageCount}
          onSetPage={setAddressPage} mainAddressId={mainAddressId} onSetMain={setMainAddress}
          onEdit={startAddressEdit} onRemove={removeAddress} addressDraft={addressDraft}
          editingAddressId={editingAddressId} onUpdateField={updateAddressField} error={addressError}
          onSave={saveAddress} onCancel={cancelAddressEdit}
          onAdd={() => { cancelAddressEdit(); setAddressFormOpen(true); }} success={addressSuccess}
        />}
        {isClient && <RecentOrderSection t={t} loading={loading} error={pageError} orders={accountOrders} onCancelOrder={onCancelOrder} />}
        {isClient && <FavoriteMenuSection
          t={t} loading={loading} error={pageError} items={favoriteItems} visibleItems={visibleFavoriteItems}
          pageSize={favoritePageSize} currentPage={currentFavoritePage} pageCount={favoritePageCount}
          onSetPage={setFavoritePage} onRemoveFavorite={requestFavoriteRemoval} onAddToCart={onAddToCart}
        />}
      </div>
    </div>
  </section>;
}
