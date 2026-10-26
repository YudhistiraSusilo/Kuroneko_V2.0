import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatRupiah } from '../utils/format.js';
import ConfirmationModal from '../components/ConfirmationModal.jsx';
import DishDetailsModal from '../components/DishDetailsModal.jsx';
import ImagePlaceholder from '../components/ImagePlaceholder.jsx';
import CategoryIcon from '../components/CategoryIcon.jsx';
import { useLanguage } from '../components/LanguageContext.jsx';
import useBodyScrollLock from '../utils/useBodyScrollLock.js';

const blankDish = { name: '', description: '', price: '', category: '', available: true, picture: '' };
const menuCategories = ['Sushi', 'Sashimi', 'Ramen', 'Drinks', 'Side dishes'];
const clientCategories = ['All dishes', ...menuCategories];
const categoryJapanese = { 'All dishes': '全部', Sushi: '寿司', Sashimi: '刺身', Ramen: 'ラーメン', Drinks: '飲み物', 'Side dishes': '一品料理' };
const menuPageSize = 12;

function MenuPicture({ dish }) {
  return <ImagePlaceholder className="dish-picture" label={`${dish.name} image`} src={dish.picture} />;
}

export default function MenuPage({ user, menu, onAddToCart, onToggleFavorite, onSaveMenuItem, onRemoveMenuItem }) {
  const { t, language } = useLanguage();
  const isAdmin = user.role === 'administrator';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cartNotification, setCartNotification] = useState('');
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [detailsDish, setDetailsDish] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All dishes');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState(blankDish);
  const closeButton = useRef(null);
  const dialog = useRef(null);
  const pictureInput = useRef(null);

  useBodyScrollLock(modalOpen);

  useEffect(() => {
    setError('');
    const timer = window.setTimeout(() => {
      if (!Array.isArray(menu)) setError('The menu could not be loaded. Please try again.');
      setLoading(false);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [menu]);

  useEffect(() => {
    if (!success) return undefined;
    const timer = window.setTimeout(() => setSuccess(''), 3500);
    return () => window.clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (!modalOpen) return undefined;
    closeButton.current?.focus();
    function closeOnEscape(event) {
      if (event.key === 'Escape') resetForm();
      if (event.key !== 'Tab') return;
      const controls = dialog.current?.querySelectorAll('button, input, select, textarea');
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
  }, [modalOpen]);

  const sortedMenu = useMemo(() => [...menu].sort((a, b) => Number(b.available) - Number(a.available)), [menu]);
  const visibleMenu = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return sortedMenu.filter((dish) => {
      const categoryMatches = selectedCategory === 'All dishes' || dish.category.toLowerCase() === selectedCategory.toLowerCase();
      const searchMatches = !query || `${dish.name} ${dish.description || ''} ${dish.category}`.toLowerCase().includes(query);
      return categoryMatches && searchMatches;
    });
  }, [searchTerm, selectedCategory, sortedMenu]);
  const totalPages = Math.max(1, Math.ceil(visibleMenu.length / menuPageSize));
  const displayedPage = Math.min(currentPage, totalPages);
  const paginatedMenu = visibleMenu.slice((displayedPage - 1) * menuPageSize, displayedPage * menuPageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  function updateField(event) {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  function readPicture(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormError('Choose an image file for the dish picture.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFormError('Choose an image smaller than 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormError('');
      setForm((current) => ({ ...current, picture: reader.result }));
    };
    reader.onerror = () => setFormError('The picture could not be read. Please choose it again.');
    reader.readAsDataURL(file);
  }

  function clearPicture() {
    setForm((current) => ({ ...current, picture: '' }));
    setFormError('');
    if (pictureInput.current) pictureInput.current.value = '';
  }

  function startEdit(dish) {
    setEditingId(dish.id);
    setForm({ ...dish, price: String(dish.price) });
    setFormError('');
    setSuccess('');
    setModalOpen(true);
  }

  function resetForm() {
    setEditingId(null);
    setForm(blankDish);
    setFormError('');
    setModalOpen(false);
  }

  function startAdd() {
    setEditingId(null);
    setForm(blankDish);
    setFormError('');
    setSuccess('');
    setModalOpen(true);
  }

  function saveDish(event) {
    event.preventDefault();
    setFormError('');
    setSuccess('');
    const price = Number(form.price);
    const description = typeof form.description === 'string' ? form.description.trim() : '';
    if (form.name.trim().length < 2 || form.name.trim().length > 80) {
      setFormError('Dish name must be between 2 and 80 characters.');
      return;
    }
    if (description.length > 300) {
      setFormError('Description must be no more than 300 characters.');
      return;
    }
    if (!menuCategories.includes(form.category)) {
      setFormError('Choose a category from the list.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0 || price > 100000000) {
      setFormError('Enter a price greater than zero and no more than IDR 100,000,000.');
      return;
    }
    const dish = {
      ...form,
      id: editingId || `dish-${Date.now()}`,
      name: form.name.trim(),
      description,
      category: form.category.trim(),
      price,
    };
    const wasEditing = Boolean(editingId);
    onSaveMenuItem(dish);
    setSuccess(wasEditing ? 'Menu item updated.' : 'Menu item added.');
    resetForm();
  }

  function deleteDish(dish) {
    setPendingRemoval(dish);
  }

  function confirmDishRemoval() {
    onRemoveMenuItem(pendingRemoval.id);
    if (editingId === pendingRemoval.id) resetForm();
    setSuccess(`${pendingRemoval.name} removed. It was also removed from active carts.`);
    setPendingRemoval(null);
  }

  function addDishToCart(dish) {
    onAddToCart(dish.id);
    setCartNotification(`${dish.name} added to your cart.`);
    window.setTimeout(() => setCartNotification(''), 2500);
  }

  return <section className="menu-page-layout">
    {!isAdmin && <div className="page-heading menu-page-heading-plain">
        <div className="menu-page-title-row">
        <div><h1>{t('Made fresh for you')}</h1><p className="japanese-accent menu-japanese-kicker" lang="ja">黒猫のおすすめ</p></div>
      </div>
    </div>}

    <div className="menu-discovery">
      <label className="menu-search"><span className="visually-hidden">{t('Search dishes')}</span><span className="menu-search-control">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>
        <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder={t('Search sushi, ramen, drinks')} />
      </span></label>
      <div className="menu-category-list" role="group" aria-label="Filter menu by category">
        {clientCategories.map((category) => <button key={category} type="button" className={`category-pill ${selectedCategory === category ? 'active' : ''}`} aria-pressed={selectedCategory === category} onClick={() => setSelectedCategory(category)}>
          <span className="category-icon"><CategoryIcon category={category} /></span>
          <span className="category-label"><span>{t(category)}</span>{language !== 'ja' && <span lang="ja">{categoryJapanese[category]}</span>}</span>
        </button>)}
      </div>
    </div>

    {isAdmin && <div className="menu-admin-toolbar">
      <span className="muted">{menu.length} {t('menu items')}</span>
      <button className="add-dish-pill" type="button" onClick={startAdd}><span aria-hidden="true">＋</span> {t('Add a dish')}</button>
    </div>}
    {success && <div key={success} className="cart-toast" role="status" aria-live="polite">✓ {t(success)}</div>}
    {cartNotification && <div key={cartNotification} className="cart-toast" role="status" aria-live="polite">✓ {t('Dish added to your cart.', { dish: cartNotification.replace(/ added to your cart\.$/, '') })}</div>}
    {detailsDish && <DishDetailsModal dish={detailsDish} onClose={() => setDetailsDish(null)} />}
    {pendingRemoval && <ConfirmationModal
      title={t('Remove this menu item?')}
      message={t('{dish} will be removed from the menu and from any active client carts.', { dish: pendingRemoval.name })}
      confirmLabel={t('Remove dish')}
      onConfirm={confirmDishRemoval}
      onCancel={() => setPendingRemoval(null)}
    />}

    {modalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) resetForm(); }}>
      <section ref={dialog} className="menu-modal" role="dialog" aria-modal="true" aria-labelledby="menu-modal-title">
        <div className="modal-heading"><div><p className="eyebrow">{t('Menu editor')}</p><h2 id="menu-modal-title">{t(editingId ? 'Edit dish' : 'Add a dish')}</h2></div><button ref={closeButton} className="modal-close" type="button" aria-label={t('Close menu editor')} onClick={resetForm}>×</button></div>
        <form className="menu-edit-form" onSubmit={saveDish}>
        <label>{t('Dish name')}<input name="name" value={form.name} onChange={updateField} minLength="2" maxLength="80" required /></label>
        <label>{t('Category')}<select name="category" value={form.category} onChange={updateField} required><option value="" disabled>{t('Choose a category')}</option>{menuCategories.map((category) => <option key={category} value={category}>{t(category)}</option>)}</select></label>
        <label>{t('Price (IDR)')}<input name="price" type="number" min="1" max="100000000" step="1" value={form.price} onChange={updateField} required /></label>
        <label className="wide-field">{t('Description')} {t('(optional)')}<textarea name="description" rows="2" maxLength="300" value={form.description} onChange={updateField} /></label>
        <div className="wide-field menu-picture-field"><label htmlFor="menu-picture">{t('Picture')}</label><input ref={pictureInput} id="menu-picture" type="file" accept="image/*" onChange={readPicture} />{form.picture && <div className="menu-picture-preview"><ImagePlaceholder className="form-image-preview" label={t('Selected dish picture')} src={form.picture} /><button className="button button-quiet danger-text" type="button" onClick={clearPicture}>{t('Remove selected picture')}</button></div>}</div>
        <label className="availability-check"><input name="available" type="checkbox" checked={form.available} onChange={updateField} /> {t('Available to clients')}</label>
        {formError && <p className="message message-error wide-field" role="alert">{t(formError)}</p>}
        <div className="modal-actions wide-field"><button className="button button-quiet" type="button" onClick={resetForm}>{t('Cancel')}</button><button className="button button-primary" type="submit">{t(editingId ? 'Save changes' : 'Add dish')}</button></div>
        </form>
      </section>
    </div>}

    {loading && <p className="message">{t('Loading menu…')}</p>}
    {!loading && error && <p className="message message-error" role="alert">{t(error)}</p>}
    {!loading && !error && menu.length === 0 && <div className="empty-state"><h3>{t('The menu is empty')}</h3><p className="muted">{t(isAdmin ? 'Add a dish using the form above.' : 'Please check back later.')}</p></div>}
    {!loading && !error && menu.length > 0 && visibleMenu.length === 0 && <div className="empty-state"><h3>{t('No dishes found')}</h3><p className="muted">{t('Try another category or search term.')}</p></div>}
    {!loading && !error && menu.length > 0 && visibleMenu.length > 0 && <>
      <div className="menu-results-heading">
        <h2>{t('Our menu')}</h2>
        <span>{visibleMenu.length} {t('menu items')}</span>
      </div>
      <div className="menu-grid">
      {paginatedMenu.map((dish) => <article className={`dish-card ${dish.available ? '' : 'dish-unavailable'}`} key={dish.id}>
        <div className="menu-card-image-wrap">
          <MenuPicture dish={dish} />
          {!isAdmin && <button className={`menu-favorite-button ${(user.favoriteMenuIds || []).includes(dish.id) ? 'selected' : ''}`} type="button" aria-label={`${(user.favoriteMenuIds || []).includes(dish.id) ? 'Remove' : 'Add'} ${dish.name} ${ (user.favoriteMenuIds || []).includes(dish.id) ? 'from' : 'to'} favorites`} aria-pressed={(user.favoriteMenuIds || []).includes(dish.id)} onClick={() => onToggleFavorite(dish.id)}>♥</button>}
        </div>
        <div className="dish-card-body">
          <div className="dish-card-title"><div><h2>{dish.name}</h2><span className="dish-japanese" lang="ja">{language === 'ja' ? (categoryJapanese[dish.category] || '料理') : `${t(dish.category)} · ${categoryJapanese[dish.category] || '料理'}`}</span></div>{!dish.available && <span className="unavailable-label">{t('Unavailable')}</span>}</div>
          <div className="dish-card-bottom"><strong className="dish-price">{formatRupiah(dish.price)}</strong>
          {isAdmin
            ? <div className="dish-admin-actions"><button className="button button-secondary" type="button" onClick={() => startEdit(dish)}>{t('Edit')}</button><button className="button button-quiet danger-text" type="button" onClick={() => deleteDish(dish)}>{t('Remove')}</button></div>
            : <div className="dish-client-actions"><button className="dish-details-button" type="button" onClick={() => setDetailsDish(dish)}>{t('Details')}</button><button className="add-to-cart-icon" type="button" aria-label={t('Add {dish} to cart', { dish: dish.name })} title={t('Add {dish} to cart', { dish: dish.name })} disabled={!dish.available} onClick={() => addDishToCart(dish)}>＋</button></div>}
          </div>
        </div>
      </article>)}
      </div>
    </>}
    {!loading && !error && visibleMenu.length > menuPageSize && <nav className="menu-pagination" aria-label={t('Menu pagination')}>
      <button className="button button-secondary" type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={displayedPage === 1}>{t('Previous')}</button>
      <span>{t('Page {current} of {total}', { current: displayedPage, total: totalPages })}</span>
      <button className="button button-secondary" type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={displayedPage === totalPages}>{t('Next')}</button>
    </nav>}
  </section>;
}
