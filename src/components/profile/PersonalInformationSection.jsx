export default function PersonalInformationSection({
  t, user, memberSince, email, phone, editing, onToggleEdit,
  fullName, onFullNameChange, onEmailChange, onPhoneChange,
  onChoosePicture, error, saving, onSave, success,
}) {
  return <section className="account-section personal-info-section" id="personal-information">
    <div className="account-section-heading"><div><span className="account-section-icon">✿</span><h2>{t('Personal Information')}</h2></div>
      <button className="button button-secondary account-edit-button" type="button" onClick={onToggleEdit} aria-expanded={editing}>{editing ? t('Cancel') : `✎ ${t('Edit')}`}</button>
    </div>
    {!editing ? <dl className="personal-info-grid">
      <div><dt>{t('Full Name')}</dt><dd>{user.displayName}</dd></div><div><dt>{t('Member Since')}</dt><dd>{memberSince}</dd></div>
      <div><dt>{t('Email')}</dt><dd>{email}</dd></div><div><dt>{t('Account Type')}</dt><dd>{t(user.role === 'administrator' ? 'Administrator' : 'Regular Member')}</dd></div>
      <div><dt>{t('Phone Number')}</dt><dd>{phone}</dd></div><div><dt>{t('Username')}</dt><dd>{user.username}</dd></div>
    </dl> : <form className="personal-info-form" onSubmit={onSave}>
      <label>{t('Full name')}<input value={fullName} onChange={onFullNameChange} minLength="2" maxLength="60" required /></label>
      <label>{t('Email')}<input type="email" value={email} onChange={onEmailChange} required /></label>
      <label>{t('Phone number')}<input type="tel" value={phone} onChange={onPhoneChange} minLength="7" maxLength="24" required /></label>
      <label className="picture-picker"><span aria-hidden="true">▣</span> {t('Change profile picture')}<input type="file" accept="image/*" onChange={onChoosePicture} /></label>
      {error && <p className="message message-error" role="alert">{error}</p>}
      <button className="button button-primary" disabled={saving}>{saving ? t('Saving…') : t('Save information')}</button>
    </form>}
    {success && <div className="profile-success-toast" role="status" aria-live="polite">{t(success)}</div>}
  </section>;
}
