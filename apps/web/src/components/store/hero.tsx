import { mapHref, storeAsset, telHref } from '@/lib/format';
import type { PublicStore } from '@kld/shared';
import Image from 'next/image';

export function Hero({
  store,
  eyebrow,
}: {
  store: PublicStore;
  eyebrow?: string;
}) {
  const { contact, branding } = store;
  const mapLink = mapHref(contact);
  const cover = branding.coverImage
    ? storeAsset(store.slug, branding.coverImage)
    : undefined;

  return (
    <section
      className={`relative overflow-hidden text-on-hero ${cover ? 'bg-ink' : 'bg-hero'}`}>
      {cover ? (
        <>
          {/* Blurred banner with a neutral dark wash so the text stays readable */}
          <Image
            src={cover}
            alt=""
            fill
            priority
            sizes="100vw"
            className="scale-110 object-cover blur-[0px]"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.62)_0%,rgba(0,0,0,.4)_55%,rgba(0,0,0,.25)_100%)]"
          />
        </>
      ) : (
        <div
          aria-hidden
          className="bg-woven absolute inset-0"
        />
      )}
      <div className="relative mx-auto flex max-w-[1440px] flex-wrap items-end justify-between gap-x-10 gap-y-[18px] px-4 pb-5 pt-[22px] sm:px-6 sm:pb-8 sm:pt-9 lg:px-8">
        <div className="min-w-0 flex-[1_1_320px]">
          {eyebrow && (
            <div className="text-xs font-semibold uppercase tracking-[.14em] text-hero-eyebrow">
              {eyebrow}
            </div>
          )}
          <h1 className="my-1.5 font-head text-[32px] font-extrabold leading-[1.05] tracking-[-.01em] sm:text-[46px]">
            {store.name}
          </h1>
          {branding.tagline && (
            <p className="mb-3 text-base text-pretty opacity-[.92]">
              {branding.tagline}
            </p>
          )}
          <div className="flex flex-wrap gap-x-[18px] gap-y-1.5 text-sm">
            {contact.openingHours && (
              <span className="flex items-center gap-[7px]">
                <span
                  aria-hidden
                  className="size-2 rounded-full bg-[#7FD69B] shadow-[0_0_0_3px_rgba(127,214,155,.25)]"
                />
                <span>
                  <b className="font-semibold">Giờ mở cửa</b> ·{' '}
                  {contact.openingHours}
                </span>
              </span>
            )}
            {contact.address && (
              <span className="opacity-[.92]">{contact.address}</span>
            )}
          </div>
        </div>
        <div className="flex max-w-[340px] flex-[1_1_260px] gap-2">
          {mapLink && (
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 flex-1 items-center justify-center rounded-pill border-[1.5px] border-[rgba(255,248,236,.55)] font-semibold text-on-hero no-underline hover:bg-[rgba(255,248,236,.08)]">
              Chỉ đường
            </a>
          )}
          <a
            href={telHref(contact.phone)}
            className="flex h-12 flex-1 items-center justify-center rounded-pill bg-accent font-bold text-on-accent no-underline hover:opacity-90">
            Gọi quán
          </a>
        </div>
      </div>
    </section>
  );
}
