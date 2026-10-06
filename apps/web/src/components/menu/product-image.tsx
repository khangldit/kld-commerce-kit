'use client';

import Image from 'next/image';
import { useState } from 'react';
import { productImage } from '@/lib/format';

/** Product photo, or a tinted placeholder (faded logo + category) so grids stay aligned. */
export function ProductImage({
  storeSlug,
  image,
  name,
  categoryName,
  monogram,
  logoUrl,
  tint,
  sizes,
  large = false,
}: {
  storeSlug: string;
  image?: string;
  name: string;
  categoryName: string;
  monogram: string;
  /** Store logo, shown faded as the placeholder; falls back to the monogram. */
  logoUrl?: string;
  tint: string;
  sizes: string;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="absolute inset-0" style={{ background: tint }}>
      {image && !failed ? (
        <Image
          src={productImage(storeSlug, image)}
          alt={name}
          fill
          sizes={sizes}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          aria-hidden
          className={`absolute inset-0 flex flex-col items-center justify-center ${large ? 'gap-2' : 'gap-[5px]'}`}
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt=""
              width={large ? 88 : 56}
              height={large ? 88 : 56}
              className={`opacity-30 mix-blend-multiply grayscale-[.4] ${large ? 'size-[88px]' : 'size-14'}`}
            />
          ) : (
            <div
              className={`grid place-items-center rounded-full border-2 border-[rgba(42,30,21,.16)] font-head font-extrabold text-[rgba(42,30,21,.24)] ${
                large ? 'size-20 text-4xl' : 'size-12 text-2xl'
              }`}
            >
              {monogram}
            </div>
          )}
          <div
            className={`max-w-full truncate px-1 font-semibold uppercase tracking-[.1em] text-[rgba(42,30,21,.45)] ${
              large ? 'text-xs' : 'text-[9.5px]'
            }`}
          >
            {categoryName}
          </div>
        </div>
      )}
    </div>
  );
}
