export default function SecurityInformationSection({ t, user, showPassword, onTogglePassword }) {
  return <section className="account-section security-section" aria-labelledby="login-information-title">
    <div className="account-section-heading"><div><span className="account-section-icon">▣</span><h2 id="login-information-title">{t('Sign-in information')}</h2></div></div>
    <dl className="personal-info-grid security-grid">
      <div><dt>{t('Password')}</dt><dd className="password-display"><span>{showPassword ? user.password : '•'.repeat(Math.max(8, user.password.length))}</span><button className="password-toggle" type="button" aria-pressed={showPassword} onClick={onTogglePassword}>{t(showPassword ? 'Hide password' : 'Show password')}</button></dd></div>
      <div><dt>{t('Account ID')}</dt><dd>{user.id}</dd></div>
    </dl>
  </section>;
}
