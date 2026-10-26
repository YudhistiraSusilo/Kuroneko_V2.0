import ImagePlaceholder from '../ImagePlaceholder.jsx';
import { formatRupiah } from '../../utils/format.js';

export default function FavoriteMenuSection({
  t, loading, error, items, visibleItems, pageSize,
  currentPage, pageCount, onSetPage, onRemoveFavorite, onAddToCart,
}) {
  return <section className="account-section favorites-section" id="favorite-menu">
    <div className="account-section-heading"><div><span className="account-section-icon">♥</span><h2>{t('Favorite Menu')}</h2></div></div>
    {loading && <p className="message">Loading favorite dishes…</p>}
    {!loading && error && <p className="message message-error" role="alert">{error}</p>}
    {!loading && !error && items.length === 0 && <div className="account-empty-state"><p>You haven’t saved any favorite dishes yet.</p></div>}
    {!loading && !error && items.length > 0 && <div className="favorite-menu-grid">
      {visibleItems.map((item) => <article className={`favorite-menu-card ${item.available ? '' : 'dish-unavailable'}`} key={item.id}>
        <ImagePlaceholder className="favorite-menu-picture" label={item.name} src={item.picture} />
        <div>
          <button className="favorite-remove" type="button" aria-label={`Remove ${item.name} from favorites`} onClick={() => onRemoveFavorite(item)}>♥</button>
          <h3>{item.name}</h3><span className="dish-japanese" lang="ja">{item.category}</span>
          <strong>{formatRupiah(item.price)}</strong>
          {!item.available ? <span className="unavailable-label">Unavailable</span> : <button className="button button-primary button-full" type="button" onClick={() => onAddToCart(item.id)}>Add to cart</button>}
        </div>
      </article>)}
    </div>}
    {!loading && !error && items.length > pageSize && <nav className="menu-pagination favorite-menu-pagination" aria-label={t('Menu pagination')}>
      <button className="button button-secondary" type="button" onClick={() => onSetPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>{t('Previous')}</button>
      <span>{t('Page {current} of {total}', { current: currentPage, total: pageCount })}</span>
      <button className="button button-secondary" type="button" onClick={() => onSetPage(Math.min(pageCount, currentPage + 1))} disabled={currentPage === pageCount}>{t('Next')}</button>
    </nav>}
  </section>;
}
