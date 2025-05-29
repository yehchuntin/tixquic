// src/components/GoogleAd.tsx
'use client';

import { useEffect } from 'react';

interface GoogleAdProps {
  slot: string;
  className?: string;
  style?: React.CSSProperties;
}

const GoogleAd = ({ slot, className = '', style = {} }: GoogleAdProps) => {
  useEffect(() => {
    try {
      // @ts-ignore: adsbygoogle is defined by the external script
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error('Adsense error:', e);
    }
  }, []);

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{ display: 'block', ...style }}
      data-ad-client="ca-pub-2436395949894310"
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
};

export default GoogleAd;
