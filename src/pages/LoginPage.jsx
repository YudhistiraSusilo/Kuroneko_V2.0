import { useEffect, useRef, useState } from 'react';
import { LanguageSelect, useLanguage } from '../components/LanguageContext.jsx';
import kuroNekoLogo from '../assets/kuroneko-logo.png';

export default function LoginPage({ users, onLogin, onSignUp }) {
  const pageRef = useRef(null);
  const { t } = useLanguage();
  const [mode, setMode] = useState('signin');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isSignUp = mode === 'signup';

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return undefined;

    const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frameId = 0;
    let pointerX = 0;
    let pointerY = 0;

    function handlePointerMove(event) {
      if (event.pointerType === 'touch') return;
      const bounds = page.getBoundingClientRect();
      pointerX = event.clientX - bounds.left;
      pointerY = event.clientY - bounds.top;
      page.classList.add('lantern-active');
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        page.style.setProperty('--lantern-x', `${pointerX}px`);
        page.style.setProperty('--lantern-y', `${pointerY}px`);
        frameId = 0;
      });
    }

    function handlePointerLeave() {
      page.classList.remove('lantern-active');
    }

    function updateTracking() {
      const shouldTrack = supportsHover.matches && !prefersReducedMotion.matches;
      const method = shouldTrack ? 'addEventListener' : 'removeEventListener';
      page[method]('pointerenter', handlePointerMove);
      page[method]('pointermove', handlePointerMove);
      page[method]('pointerleave', handlePointerLeave);
      page[method]('pointercancel', handlePointerLeave);
      if (!shouldTrack) {
        handlePointerLeave();
        if (frameId) window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
    }

    updateTracking();
    supportsHover.addEventListener('change', updateTracking);
    prefersReducedMotion.addEventListener('change', updateTracking);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      page.removeEventListener('pointerenter', handlePointerMove);
      page.removeEventListener('pointermove', handlePointerMove);
      page.removeEventListener('pointerleave', handlePointerLeave);
      page.removeEventListener('pointercancel', handlePointerLeave);
      supportsHover.removeEventListener('change', updateTracking);
      prefersReducedMotion.removeEventListener('change', updateTracking);
    };
  }, []);

  function changeMode(nextMode) {
    setMode(nextMode);
    setError('');
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const cleanUsername = username.trim().toLowerCase();
    if (isSignUp) {
      if (displayName.trim().length < 2 || displayName.trim().length > 60) {
        setError('Enter a name between 2 and 60 characters.');
        return;
      }
      if (!/^[a-z0-9_]{3,24}$/.test(cleanUsername)) {
        setError('Username must be 3–24 characters using letters, numbers, or underscores.');
        return;
      }
      if (password.length < 6) {
        setError('Choose a password with at least 6 characters.');
        return;
      }
      if (users.some((account) => account.username.toLowerCase() === cleanUsername)) {
        setError('That username is already taken. Please choose another.');
        return;
      }
    }

    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      if (isSignUp) {
        onSignUp({
          id: `client-${Date.now()}`,
          displayName: displayName.trim(),
          username: cleanUsername,
          password,
          role: 'client',
        });
        return;
      }

      const matchedUser = users.find(
        (account) => account.username.toLowerCase() === cleanUsername && account.password === password,
      );
      if (matchedUser) onLogin(matchedUser);
      else setError('That username and password do not match. Please try again.');
    }, 350);
  }

  return <main className="login-page lantern-target" ref={pageRef}>
    <span className="lantern-light" aria-hidden="true" />
    <section className="login-card">
      <div className="login-card-topline">
        <img className="login-brand-logo" src={kuroNekoLogo} alt="Kuro Neko" />
      </div>
      <h1>{t(isSignUp ? 'Create your account' : 'Welcome to Kuro Neko')}</h1>
      <p className="eyebrow">{t('A taste of Japan, close to home')}</p>

      <div className="auth-switch" aria-label={t('Choose sign in or sign up')}>
        <button className={!isSignUp ? 'selected' : ''} type="button" aria-pressed={!isSignUp} onClick={() => changeMode('signin')}>{t('Sign in')}</button>
        <button className={isSignUp ? 'selected' : ''} type="button" aria-pressed={isSignUp} onClick={() => changeMode('signup')}>{t('Sign up')}</button>
      </div>

      <form className="form-stack" onSubmit={handleSubmit}>
        {isSignUp && <label htmlFor="signup-name">{t('Full name')}<input id="signup-name" autoComplete="name" maxLength="60" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required aria-invalid={Boolean(error)} /></label>}
        <label htmlFor="auth-username">{t('Username')}<input id="auth-username" autoComplete="username" minLength={isSignUp ? 3 : undefined} maxLength="24" value={username} onChange={(event) => setUsername(event.target.value)} required aria-invalid={Boolean(error)} /></label>
        <label htmlFor="auth-password">{t('Password')}<span className="password-field-control">
          <input id="auth-password" type={showPassword ? 'text' : 'password'} autoComplete={isSignUp ? 'new-password' : 'current-password'} minLength={isSignUp ? 6 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} required aria-invalid={Boolean(error)} />
          <button className="password-eye-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={t(showPassword ? 'Hide password' : 'Show password')} aria-pressed={showPassword}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z" />
              <circle cx="12" cy="12" r="2.7" />
              {!showPassword && <path d="m4 4 16 16" />}
            </svg>
          </button>
        </span></label>
        {error && <p id="auth-error" className="message message-error" role="alert">{t(error)}</p>}
        <button className="button button-primary button-full" disabled={loading}>{loading ? t('Please wait…') : t(isSignUp ? 'Create account' : 'Sign in')}</button>
      </form>

      <div className="login-card-bottomline">
        {!isSignUp && <div className="demo-accounts">
          <strong>{t('Demo accounts')}</strong>
          <span>{t('Client')}: client / client123</span>
          <span>{t('Administrator')}: admin / admin123</span>
        </div>}
        <LanguageSelect className="login-language-select" />
      </div>
    </section>
    <p className="login-footer">{t('Made with care in the Kuro Neko kitchen')}</p>
  </main>;
}
