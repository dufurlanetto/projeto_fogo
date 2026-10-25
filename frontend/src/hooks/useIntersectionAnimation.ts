import { useEffect, useRef, useCallback } from 'react';

export function useIntersectionAnimation(threshold = 0.5) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
          entry.target.classList.remove('esquerda', 'direita', 'cima');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold });

    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  const elementoCallbackRef = useCallback((elemento: HTMLElement | null) => {
    if (elemento && observerRef.current) {
      observerRef.current.observe(elemento);
    }
  }, []);

  return elementoCallbackRef;
}
