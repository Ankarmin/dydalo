'use client';

import Image from 'next/image';
import { useState } from 'react';

export function SafeImage({
  src,
  alt,
  width,
  height,
  sizes,
  className,
  priority = false,
  fallback = '/images/dydalo-panoramica.png',
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
  fallback?: string;
}) {
  const [broken, setBroken] = useState(false);

  return (
    <Image
      src={broken ? fallback : src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      onError={() => setBroken(true)}
      className={className}
    />
  );
}
