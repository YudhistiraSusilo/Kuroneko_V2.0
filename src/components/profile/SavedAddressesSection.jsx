export default function SavedAddressesSection({
  t, addresses, visibleAddresses, addressFormOpen, addressPageSize,
  currentAddressPage, addressPageCount, onSetPage, mainAddressId,
  onSetMain, onEdit, onRemove, addressDraft, editingAddressId,
  onUpdateField, error, onSave, onCancel, onAdd, success,
}) {
  return <section className="account-section addresses-section" id="saved-addresses">
    <div className="account-section-heading">
      <div><span className="account-section-icon">⌖</span><h2>{t('Addresses')}</h2></div>
      <button className="button button-primary account-add-button" type="button" onClick={onAdd}>＋ {t('Add New Address')}</button>
    </div>
    {success && <div className="profile-address-toast" role="status" aria-live="polite">{t(success)}</div>}
    {addresses.length === 0 && !addressFormOpen && <div className="account-empty-state"><p>No saved addresses yet.</p><button className="button button-secondary" type="button" onClick={onAdd}>Add your first address</button></div>}
    {addresses.length > 0 && <div className="saved-address-grid">
      {visibleAddresses.map((address) => <article className="saved-address-card" key={address.id}>
        <div><span className="address-pin">⌂</span><div><strong>{address.label}</strong>{address.id === mainAddressId && <span className="main-address-badge">{t('Main address')}</span>}<p>{address.recipient}</p><p>{address.phone}</p><p>{address.address}</p></div></div>
        <div className="address-actions">
          {address.id !== mainAddressId && <button className="main-address-button" type="button" onClick={() => onSetMain(address.id)}>{t('Set as main')}</button>}
          <button type="button" onClick={() => onEdit(address)}>{t('Edit')}</button><button type="button" onClick={() => onRemove(address.id)}>{t('Delete')}</button>
        </div>
      </article>)}
    </div>}
    {addresses.length > addressPageSize && <nav className="menu-pagination address-pagination" aria-label="Address pagination">
      <button className="button button-secondary" type="button" onClick={() => onSetPage(Math.max(1, currentAddressPage - 1))} disabled={currentAddressPage === 1}>{t('Previous')}</button>
      <span>{t('Page {current} of {total}', { current: currentAddressPage, total: addressPageCount })}</span>
      <button className="button button-secondary" type="button" onClick={() => onSetPage(Math.min(addressPageCount, currentAddressPage + 1))} disabled={currentAddressPage === addressPageCount}>{t('Next')}</button>
    </nav>}
    {addressFormOpen && <form className="address-edit-form" onSubmit={onSave}>
      <h3>{editingAddressId ? 'Edit address' : 'Add a new address'}</h3>
      <div className="address-form-grid">
        <label>Address label<input name="label" placeholder="Home, Work" value={addressDraft.label} onChange={onUpdateField} required /></label>
        <label>Recipient name<input name="recipient" value={addressDraft.recipient} onChange={onUpdateField} required /></label>
        <label>Phone number<input name="phone" type="tel" value={addressDraft.phone} onChange={onUpdateField} required /></label>
        <label className="address-wide-field">Full address<textarea name="address" rows="2" value={addressDraft.address} onChange={onUpdateField} required /></label>
      </div>
      {error && <p className="message message-error" role="alert">{error}</p>}
      <div className="address-actions"><button className="button button-quiet" type="button" onClick={onCancel}>Cancel</button><button className="button button-primary" type="submit">Save address</button></div>
    </form>}
  </section>;
}
