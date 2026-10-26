import { useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const TRANSITION_DURATION = 800;

export default function RouteMotion() {
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);
  const [transitionPath, setTransitionPath] = useState('');

  useLayoutEffect(() => {
    if (previousPath.current === pathname) return undefined;
    previousPath.current = pathname;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setTransitionPath('');
      return undefined;
    }

    setTransitionPath(pathname);
    const timer = window.setTimeout(() => setTransitionPath(''), TRANSITION_DURATION);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  if (!transitionPath) return null;

  return <div key={transitionPath} className="route-washi-overlay" aria-hidden="true">
    <span className="visually-hidden">Page transition</span>
  </div>;
}
