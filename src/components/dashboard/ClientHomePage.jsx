import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import OrderCard from '../OrderCard.jsx';
import ImagePlaceholder from '../ImagePlaceholder.jsx';
import heroBackground from '../../../menu pictures/hero_background.png';
import storyPoster from '../../../menu pictures/our story_poster.png';
import branchImage from '../../../menu pictures/branch_JKT.png';
import kuroNekoLogo from '../../assets/kuroneko-logo.png';

function useLanternLight() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!section) return undefined;

    let frameId = 0;
    let pointerX = 0;
    let pointerY = 0;

    function handlePointerMove(event) {
      if (event.pointerType === 'touch') return;

      const bounds = section.getBoundingClientRect();
      pointerX = event.clientX - bounds.left;
      pointerY = event.clientY - bounds.top;
      section.classList.add('lantern-active');

      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        section.style.setProperty('--lantern-x', `${pointerX}px`);
        section.style.setProperty('--lantern-y', `${pointerY}px`);
        frameId = 0;
      });
    }

    function handlePointerLeave() {
      section.classList.remove('lantern-active');
    }

    function updateTracking() {
      const shouldTrack = supportsHover.matches && !prefersReducedMotion.matches;
      const method = shouldTrack ? 'addEventListener' : 'removeEventListener';
      section[method]('pointerenter', handlePointerMove);
      section[method]('pointermove', handlePointerMove);
      section[method]('pointerleave', handlePointerLeave);
      section[method]('pointercancel', handlePointerLeave);
      if (!shouldTrack) {
        section.classList.remove('lantern-active');
        if (frameId) window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
    }

    updateTracking();
    supportsHover.addEventListener('change', updateTracking);
    prefersReducedMotion.addEventListener('change', updateTracking);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      section.removeEventListener('pointerenter', handlePointerMove);
      section.removeEventListener('pointermove', handlePointerMove);
      section.removeEventListener('pointerleave', handlePointerLeave);
      section.removeEventListener('pointercancel', handlePointerLeave);
      supportsHover.removeEventListener('change', updateTracking);
      prefersReducedMotion.removeEventListener('change', updateTracking);
    };
  }, []);

  return sectionRef;
}

export default function ClientHomePage({
  t, language, loading, error, activeOrders, signatureItems,
  onCancelOrder, signatureToast, onAddSignatureDish,
  footerEmail, footerMessage, onFooterEmailChange, onFooterSignup,
}) {
  const heroRef = useLanternLight();
  const storyRef = useLanternLight();
  const contactRef = useLanternLight();

  return <section className="client-homepage">
    <section className="client-hero lantern-target" id="home" ref={heroRef}>
      <img className="client-hero-background" src={heroBackground} alt="" aria-hidden="true" />
      <span className="lantern-light" aria-hidden="true" />
      <div className="client-hero-copy">
        <p className="eyebrow">KuroNeko · {t('Japanese kitchen')}</p>
        <h1>{t('A little piece of Japan, always with you.')}</h1>
        <p className="hero-description">{t('Handcrafted sushi, delicate sashimi, and Japanese comfort food, prepared with care for your table.')}</p>
        {language !== 'ja' && <p className="hero-japanese" lang="ja">やさしい味、いつもそばに。</p>}
        <Link className="button button-primary hero-menu-link" to="/menu">{t('Explore our menu')} <span aria-hidden="true">→</span></Link>
      </div>
    </section>

    {(loading || error || activeOrders.length > 0) && <section className="client-home-section client-active-orders" aria-labelledby="active-orders-title">
      <div className="section-heading"><h2 id="active-orders-title">{t('Your active orders')}</h2></div>
      {loading && <p className="message">{t('Loading your orders…')}</p>}
      {!loading && error && <p className="message message-error" role="alert">{t(error)}</p>}
      {!loading && !error && <div className="orders-grid">{activeOrders.map((order) => <OrderCard key={order.id} order={order} onCancelOrder={onCancelOrder} />)}</div>}
    </section>}

    <section className="client-home-section home-banner signature-banner" id="signature">
      <div className="home-banner-inner">
        <div className="signature-heading">
          <div>
            <div className="signature-title-line"><h2>{t('Our Signature')}</h2><span className="signature-rule" aria-hidden="true" /><p>{t('A selection of our most loved dishes.')}</p></div>
            <p className="eyebrow signature-japanese-label" lang="ja">{language === 'ja' ? 'こだわりの料理' : '人気メニュー'}</p>
          </div>
          <Link className="signature-menu-link" to="/menu">{t('View full menu')} <span aria-hidden="true">→</span></Link>
        </div>
        {signatureToast && <div key={signatureToast} className="cart-toast" role="status" aria-live="polite">✓ {signatureToast}</div>}
        {loading && <p className="message">{t('Loading signature dishes…')}</p>}
        {!loading && error && <p className="message message-error" role="alert">{t(error)}</p>}
        {!loading && !error && signatureItems.length === 0 && <div className="empty-state"><h3>{t('No signature dishes available')}</h3><p className="muted">{t('Please check back soon.')}</p></div>}
        {!loading && !error && signatureItems.length > 0 && <div className="signature-grid">
          {signatureItems.map((item) => <article className="signature-card" key={item.id}>
            <ImagePlaceholder className="signature-picture" label={item.name} src={item.picture} />
            <div>
              <span className="signature-category">{t(item.category)}</span><h3>{item.name}</h3><p>{item.description}</p>
              <div className="signature-card-footer">
                <strong>Rp {item.price.toLocaleString(language === 'id' ? 'id-ID' : language === 'ja' ? 'ja-JP' : 'en-US')}</strong>
                <button className="signature-add-button" type="button" aria-label={t('Add {dish} to cart', { dish: item.name })} title={t('Add {dish} to cart', { dish: item.name })} onClick={() => onAddSignatureDish(item)}>＋</button>
              </div>
            </div>
          </article>)}
        </div>}
      </div>
    </section>

    <section className="client-home-section home-banner story-banner lantern-target" id="about" ref={storyRef}>
      <span className="lantern-light" aria-hidden="true" />
      <div className="home-banner-inner story-layout">
        <div>
          <div className="story-heading-line"><h2>{t('The Story of Kuro Neko')}</h2><span className="signature-rule" aria-hidden="true" /></div>
          {language !== 'ja' && <p className="japanese-accent" lang="ja">黒猫の物語</p>}
          <p>{t('Kuro Neko began with a black cat that wandered into our first kitchen in 1987 — Kuro, the original mascot. He would sit on the prep counter, watching the chefs, and leave one of his whisker-length fur tufts on every plate that was not finished to his standards.')}</p>
          <p>{t('Every dish we serve today still carries that watch. Fresh fish cut to order, broth that simmers for hours, and a kitchen that refuses to rush. Kuro still visits — ask your server where he is sitting.')}</p>
        </div>
        <ImagePlaceholder className="interior-placeholder" label="Kuro Neko story poster" src={storyPoster} />
      </div>
    </section>

    <section className="client-home-section home-banner branches-banner" id="branches">
      <div className="home-banner-inner">
        <div className="branch-heading-line"><h2>{t('Our branches')}</h2><span className="signature-rule" aria-hidden="true" /><p className="branch-heading-caption">A FEW PLACES TO FIND US.</p></div>
        {language !== 'ja' && <p className="japanese-accent branch-japanese" lang="ja">お近くの店舗でお待ちしております</p>}
        <div className="branch-cards">
          <article><ImagePlaceholder className="branch-placeholder" label="Jakarta branch" src={branchImage} /><strong>Jakarta</strong><span>Location details coming soon</span></article>
          <article><ImagePlaceholder className="branch-placeholder" label="Tangerang branch" src={branchImage} /><strong>Tangerang</strong><span>Location details coming soon</span></article>
          <article><ImagePlaceholder className="branch-placeholder" label="Bekasi branch" src={branchImage} /><strong>Bekasi</strong><span>Location details coming soon</span></article>
        </div>
      </div>
    </section>

    <div className="contact-footer-lantern-region lantern-target" ref={contactRef}>
      <span className="lantern-light" aria-hidden="true" />
      <section className="client-home-section home-banner contact-banner" id="contact">
        <div className="home-banner-inner contact-layout">
          <div><p className="eyebrow">{t('We are here to help')}</p><h2>{t('Say hello')}</h2>{language !== 'ja' && <p className="japanese-accent" lang="ja">いつでもお気軽にどうぞ</p>}<p>{t('Questions about your order? Get in touch with our team.')}</p></div>
          <div className="contact-details">
            <a className="contact-row" href="mailto:hello@kuroneko.example"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg><span>hello@kuroneko.example</span></a>
            <a className="contact-row" href="tel:+622155502233"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h3l2 5-2 2a15 15 0 0 0 4 4l2-2 5 2v3c0 1.1-.9 2-2 2C10 19 5 14 5 5c0-1.1.9-2 2-2Z" /></svg><span>+62 21 5550 2233</span></a>
            <a className="contact-row" href="https://instagram.com/" target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle className="contact-icon-dot" cx="17.5" cy="6.5" r="0.8" /></svg><span>Instagram · @kuroneko.kitchen</span></a>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="footer-column footer-brand-column">
            <Link className="footer-brand" to="/dashboard"><img className="footer-brand-logo" src={kuroNekoLogo} alt="" aria-hidden="true" /><span className="footer-brand-name">KURO NEKO</span></Link>
            <p>{t('Japanese kitchen')} · Sushi, sashimi, and comfort food</p>
            {language !== 'ja' && <p className="footer-japanese" lang="ja">おいしい時間を、あなたと。</p>}
          </div>
          <nav className="footer-column footer-quick-links" aria-label={t('Quick links')}>
            <h2>{t('Quick links')}</h2>
            <Link to="/dashboard?section=home">{t('Home')}</Link><Link to="/menu">{t('Menu')}</Link>
            <Link to="/dashboard?section=about">{t('About')}</Link><Link to="/dashboard?section=branches">{t('Branches')}</Link>
          </nav>
          <div className="footer-column footer-contact-column">
            <h2>{t('Contact')}</h2>
            <a href="mailto:hello@kuroneko.example">hello@kuroneko.example</a>
            <a href="tel:+622155502233">+62 21 5550 2233</a>
            <div className="footer-social-links"><a href="https://instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram">◎</a><a href="https://tiktok.com/" target="_blank" rel="noreferrer" aria-label="TikTok">♪</a><a href="https://youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube">▶</a></div>
          </div>
          <div className="footer-column footer-signup-column">
            <h2>{t('Join our journey')}</h2>
            <p>{t('Get updates on new menus, special offers, and cozy moments from Kuro Neko.')}</p>
            <form className="footer-signup-form" onSubmit={onFooterSignup} noValidate>
              <label className="visually-hidden" htmlFor="footer-email">{t('Your email address')}</label>
              <input id="footer-email" type="email" autoComplete="email" placeholder={t('Your email address')} value={footerEmail} onChange={(event) => onFooterEmailChange(event.target.value)} />
              <button type="submit" aria-label={t('Join our journey')}>→</button>
            </form>
            {footerMessage && <div key={footerMessage} className="cart-toast footer-signup-toast" role="status" aria-live="polite">{footerMessage}</div>}
          </div>
          <small className="footer-copyright">© {new Date().getFullYear()} Kuro Neko. Made with care.</small>
        </div>
      </footer>
    </div>
  </section>;
}
