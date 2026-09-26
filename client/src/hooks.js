import { useEffect, useLayoutEffect, useRef, useState } from "react";

function isVisible(el) {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return rect.top < vh * 0.95 && rect.bottom > vh * 0.05;
}

/** Fires once when element enters the viewport. */
export function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (isVisible(el)) setInView(true);
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -5% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [inView]);

  return [ref, inView];
}

export function useCountUp(target, active, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target, duration]);

  return value;
}

/**
 * Scroll-linked light bar: progress 0→1 as the rail moves through the viewport.
 * Lights grow when scrolling down, shrink when scrolling up.
 */
export function useLightRail(itemSelector = ".timeline-row, .journey-item") {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frame = 0;
    let current = 0;
    let target = 0;
    // ponytail: fixed lerp ceiling — upgrade to spring if overshoot ever feels right
    const ease = 0.06;

    const readTarget = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // Stretch fill across a longer scroll window so it crawls, not snaps.
      const start = vh * 0.72;
      const end = vh * 0.18;
      const travel = Math.max(rect.height + (start - end), 1);
      target = Math.min(1, Math.max(0, (start - rect.top) / travel));
    };

    const paint = () => {
      const rect = el.getBoundingClientRect();
      const fillY = rect.top + rect.height * current;
      el.querySelectorAll(itemSelector).forEach((item) => {
        const ir = item.getBoundingClientRect();
        const nodeY = ir.top + Math.min(24, ir.height * 0.2);
        item.classList.toggle("is-lit", nodeY <= fillY + 6);
      });
    };

    const tick = () => {
      readTarget();
      const delta = target - current;
      if (Math.abs(delta) < 0.0008) {
        current = target;
        setProgress(current);
        paint();
        frame = 0;
        return;
      }
      current += delta * ease;
      setProgress(current);
      paint();
      frame = requestAnimationFrame(tick);
    };

    const kick = () => {
      if (frame) return;
      frame = requestAnimationFrame(tick);
    };

    readTarget();
    current = target;
    setProgress(current);
    paint();

    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    return () => {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [itemSelector]);

  return [ref, progress];
}
