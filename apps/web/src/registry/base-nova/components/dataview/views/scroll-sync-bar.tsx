"use client";

import { useEffect, useRef, useState } from "react";
import type { ScrollSync } from "@/registry/base-nova/hooks/dataview/use-scroll-sync";

/**
 * A visible horizontal scrollbar that syncs with all registered scroll
 * containers. Used in grouped mode where each group's own scrollbar is
 * hidden. Sizes itself to the widest registered container.
 */
export function ScrollSyncBar({ sync }: { sync: ScrollSync }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const { measureContentWidth, register, subscribe } = sync;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const update = () => setContentWidth(measureContentWidth(el));
    const unsubscribe = subscribe(update);
    const unregister = register(el);
    update();
    return () => {
      unsubscribe();
      unregister();
    };
  }, [measureContentWidth, register, subscribe]);

  return (
    <div
      className="sticky bottom-0 overflow-x-auto"
      ref={scrollRef}
      style={
        contentWidth === 0 ? { visibility: "hidden", height: 0 } : undefined
      }
    >
      <div style={{ width: contentWidth, height: 1 }} />
    </div>
  );
}
