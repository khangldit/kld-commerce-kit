import { StoreMark } from '@/components/ui';
import { platform } from '@/config/platform';
import { getCurrentYear } from '@/lib/api';
import { formatPhone, mapHref, storeAsset, telHref } from '@/lib/format';
import type { PublicStore } from '@kld/shared';
import Image from 'next/image';
import { PaymentInfoButton } from './payment-info';

const PILL_LINK =
  'flex h-11 items-center rounded-pill border border-[rgba(241,230,212,.3)] px-4 text-sm font-semibold text-on-footer no-underline hover:bg-[rgba(241,230,212,.08)]';

export async function SiteFooter({
  store,
  monogram,
}: {
  store: PublicStore;
  monogram: string;
}) {
  const year = await getCurrentYear();
  const { contact, payment, branding } = store;
  const mapLink = mapHref(contact);
  // Exact pin when known, else search by address
  const mapQuery = contact.geo
    ? `${contact.geo.lat},${contact.geo.lng}`
    : contact.address;
  const hasPayment = Boolean(
    payment.qrImage || payment.accountNumber || payment.bankName,
  );
  console.log('______mapQuery', encodeURIComponent('10.5897623, 106.4068949'));
  return (
    <footer className="mt-10 bg-footer text-on-footer">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-7 px-4 pb-6 pt-8 sm:px-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:px-8">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <StoreMark
              monogram={monogram}
              name={store.name}
              tone="footer"
              logoUrl={
                branding.logo
                  ? storeAsset(store.slug, branding.logo)
                  : undefined
              }
            />
            <div className="font-head text-xl font-bold">{store.name}</div>
          </div>
          <dl className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
            {contact.address && (
              <>
                <dt className="text-footer-2">Địa chỉ</dt>
                <dd>{contact.address}</dd>
              </>
            )}
            {contact.openingHours && (
              <>
                <dt className="text-footer-2">Giờ mở cửa</dt>
                <dd>{contact.openingHours}</dd>
              </>
            )}
            <dt className="text-footer-2">Điện thoại</dt>
            <dd className="flex flex-wrap gap-x-2">
              <a
                href={telHref(contact.phone)}
                className="text-on-footer no-underline">
                {formatPhone(contact.phone)}
              </a>
              {contact.secondaryPhone && (
                <>
                  <span
                    aria-hidden
                    className="text-footer-2">
                    –
                  </span>
                  <a
                    href={telHref(contact.secondaryPhone)}
                    className="text-on-footer no-underline">
                    {formatPhone(contact.secondaryPhone)}
                  </a>
                </>
              )}
            </dd>
          </dl>
          <div className="flex flex-wrap gap-2">
            <a
              href={telHref(contact.phone)}
              className={PILL_LINK}>
              Gọi điện
            </a>
            {contact.zalo && (
              <a
                href={contact.zalo}
                target="_blank"
                rel="noopener noreferrer"
                className={PILL_LINK}>
                Zalo
              </a>
            )}
            {contact.facebook && (
              <a
                href={contact.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className={PILL_LINK}>
                Facebook
              </a>
            )}
          </div>
          {hasPayment && <PaymentInfoButton />}
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          {mapQuery ? (
            <iframe
              title={`Bản đồ đến ${store.name}`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=17&output=embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[220px] w-full rounded-lg border border-[rgba(241,230,212,.18)]"
            />
          ) : contact.mapQrImage ? (
            <Image
              src={storeAsset(store.slug, contact.mapQrImage)}
              alt="QR chỉ đường"
              width={220}
              height={220}
              className="rounded-lg"
            />
          ) : null}
          {mapLink && (
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-on-footer hover:text-on-footer">
              Mở trong Google Maps →
            </a>
          )}
        </div>
      </div>
      <div className="border-t border-[rgba(241,230,212,.14)]">
        <div className="mx-auto flex max-w-[1440px] flex-wrap justify-between gap-x-4 gap-y-1.5 px-4 py-3.5 text-[12.5px] text-footer-2 sm:px-6 lg:px-8">
          <span>
            © {year} {store.name}
          </span>
          <a
            href={platform.contactUrl}
            target="_blank"
            rel="noopener nofollow"
            className="text-footer-2 hover:text-on-footer">
            {platform.creditText}
          </a>
        </div>
      </div>
    </footer>
  );
}
