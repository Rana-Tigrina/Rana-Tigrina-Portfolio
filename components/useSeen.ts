"use client";
import { useEffect, useRef } from "react";

// Adds the class "seen" the first time the element scrolls into view. CSS does the rest.
export function useSeen<T extends Element>(onSeen?: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("seen");
        onSeen?.();
        io.disconnect();
      },
      { threshold: 0.5 },
    );
    io.observe(ref.current!);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
}
