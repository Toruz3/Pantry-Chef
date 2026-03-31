import React, { useState, useEffect } from 'react';

interface DelayedFallbackProps {
  children: React.ReactNode;
  delayMs?: number;
}

export function DelayedFallback({ children, delayMs = 200 }: DelayedFallbackProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  if (!show) return null;

  return <>{children}</>;
}
