import { useEffect, useState } from 'react';

const SPEED = 24;
const START_DELAY = 600;
const RESUME_DELAY = 1800;
const EDGE_PAUSE = 1100;
const RAMP_DURATION = 1200;
const EDGE_DISTANCE = 90;

export default function useBedMapAutoScroll(
  enabled: boolean,
  scopeKey: string
) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!node || !enabled) return;

    const motion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );
    const desktop = window.matchMedia(
      '(hover: hover) and (pointer: fine)'
    );

    let frame = 0;
    let previousTime: number | null = null;
    let movingSince: number | null = null;
    let position = node.scrollTop;
    let direction = 1;
    let resumeAt = performance.now() + START_DELAY;
    let hovered = node.matches(':hover');
    let focused = node.contains(document.activeElement);
    let visible = true;

    const resetMotion = () => {
      previousTime = null;
      movingSince = null;
      position = node.scrollTop;
    };

    const pause = (delay = RESUME_DELAY) => {
      resumeAt = performance.now() + delay;
      resetMotion();
    };

    const enter = () => {
      hovered = true;
      resetMotion();
    };

    const leave = () => {
      hovered = false;
      pause(600);
    };

    const focusIn = () => {
      focused = true;
      resetMotion();
    };

    const focusOut = (event: FocusEvent) => {
      focused = node.contains(event.relatedTarget as Node | null);

      if (!focused) pause(600);
    };

    const interact = () => pause();
    const environmentChanged = () => pause(START_DELAY);

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        resetMotion();
      },
      { threshold: 0 }
    );

    observer.observe(node);

    const animate = (time: number) => {
      const max = Math.max(
        0,
        node.scrollHeight - node.clientHeight
      );

      const paused =
        motion.matches ||
        !desktop.matches ||
        document.hidden ||
        !visible ||
        hovered ||
        focused ||
        time < resumeAt ||
        max <= 2;

      if (paused) {
        resetMotion();
      } else {
        position = Math.max(0, Math.min(max, position));

        if (previousTime === null) {
          previousTime = time;
          movingSince = time;
        }

        const delta = Math.min(time - previousTime, 50) / 1000;
        previousTime = time;

        const progress = Math.min(
          1,
          (time - (movingSince ?? time)) / RAMP_DURATION
        );

        // Smooth acceleration after starting or resuming.
        const acceleration =
          progress * progress * (3 - 2 * progress);

        const remaining =
          direction > 0 ? max - position : position;

        // Gradually slow down near the destination edge.
        const edgeFactor =
          0.25 +
          0.75 * Math.min(1, remaining / EDGE_DISTANCE);

        position +=
          direction * SPEED * acceleration * edgeFactor * delta;

        position = Math.max(0, Math.min(max, position));
        node.scrollTop = position;

        const reachedEdge =
          (direction > 0 && max - position <= 0.5) ||
          (direction < 0 && position <= 0.5);

        if (reachedEdge) {
          position = direction > 0 ? max : 0;
          node.scrollTop = position;
          direction *= -1;
          resumeAt = time + EDGE_PAUSE;
          previousTime = null;
          movingSince = null;
        }
      }

      frame = window.requestAnimationFrame(animate);
    };

    node.addEventListener('pointerenter', enter);
    node.addEventListener('pointerleave', leave);
    node.addEventListener('focusin', focusIn);
    node.addEventListener('focusout', focusOut);
    node.addEventListener('wheel', interact, { passive: true });
    node.addEventListener('pointerdown', interact, { passive: true });
    node.addEventListener('touchstart', interact, { passive: true });
    node.addEventListener('keydown', interact);

    document.addEventListener(
      'visibilitychange',
      environmentChanged
    );
    motion.addEventListener('change', environmentChanged);
    desktop.addEventListener('change', environmentChanged);

    frame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();

      node.removeEventListener('pointerenter', enter);
      node.removeEventListener('pointerleave', leave);
      node.removeEventListener('focusin', focusIn);
      node.removeEventListener('focusout', focusOut);
      node.removeEventListener('wheel', interact);
      node.removeEventListener('pointerdown', interact);
      node.removeEventListener('touchstart', interact);
      node.removeEventListener('keydown', interact);

      document.removeEventListener(
        'visibilitychange',
        environmentChanged
      );
      motion.removeEventListener('change', environmentChanged);
      desktop.removeEventListener('change', environmentChanged);
    };
  }, [node, enabled, scopeKey]);

  return setNode;
}