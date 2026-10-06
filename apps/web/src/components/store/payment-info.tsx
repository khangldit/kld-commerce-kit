'use client';

import type { PublicStorePayment } from '@kld/shared';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import { storeAsset } from '@/lib/format';
import { useBodyScrollLock, useEscape } from '@/lib/hooks';
import { useUi } from '@/stores/ui';

export function PaymentInfoButton() {
  return (
    <button
      type="button"
      onClick={() => useUi.getState().setPaymentOpen(true)}
      className="h-12 self-start rounded-pill bg-on-footer px-5 font-bold text-footer"
    >
      Thông tin thanh toán
    </button>
  );
}

/** Store bank info / QR. Not part of checkout — the store asks for a deposit by phone. */
export function PaymentDialog({
  storeSlug,
  payment,
}: {
  storeSlug: string;
  payment: PublicStorePayment;
}) {
  const open = useUi((s) => s.paymentOpen);
  const setOpen = useUi((s) => s.setPaymentOpen);
  const [copied, setCopied] = useState(false);
  const close = useCallback(() => {
    setOpen(false);
    setCopied(false);
  }, [setOpen]);

  useBodyScrollLock(open);
  useEscape(open, close);

  if (!open) return null;

  async function copyAccount() {
    try {
      await navigator.clipboard.writeText(
        (payment.accountNumber ?? '').replace(/\s/g, ''),
      );
      setCopied(true);
    } catch {
      // Clipboard blocked — the number is still visible to copy by hand
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-title"
    >
      <div className="absolute inset-0 bg-[rgba(42,30,21,.55)]" onClick={close} />
      <div className="relative w-full max-w-[380px] overflow-hidden rounded-xl bg-surface shadow-modal">
        <div className="flex items-start justify-between gap-3 px-5 pb-1.5 pt-[18px]">
          <div>
            <h2 id="payment-title" className="font-head text-[21px] font-bold">
              Thông tin thanh toán
            </h2>
            <p className="mt-1 text-[13px] text-pretty text-ink-2">
              Chỉ chuyển khoản khi quán gọi xác nhận hoặc yêu cầu đặt cọc.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Đóng"
            className="-mr-2.5 -mt-1.5 size-11 flex-none rounded-full text-2xl text-ink-2"
          >
            ×
          </button>
        </div>

        <div className="px-5 pt-3">
          {payment.qrImage ? (
            <Image
              src={storeAsset(storeSlug, payment.qrImage)}
              alt="QR chuyển khoản"
              width={200}
              height={200}
              className="mx-auto rounded-md border border-line"
            />
          ) : (
            <div className="mx-auto grid size-[200px] place-items-center rounded-md border border-line bg-[repeating-linear-gradient(135deg,rgba(42,30,21,.09)_0_6px,rgba(42,30,21,.03)_6px_12px)] text-center font-mono text-[11px] tracking-[.08em] text-ink-2">
              QR NGÂN HÀNG
              <br />
              (đang cập nhật)
            </div>
          )}
        </div>

        {(payment.bankName || payment.accountNumber || payment.accountName) && (
          <dl className="mx-5 mt-4 rounded-md border border-line text-sm">
            {payment.bankName && (
              <div className="flex justify-between gap-3 border-b border-line-soft px-3.5 py-2.5 last:border-b-0">
                <dt className="text-ink-2">Ngân hàng</dt>
                <dd className="font-semibold">{payment.bankName}</dd>
              </div>
            )}
            {payment.accountNumber && (
              <div className="flex items-center justify-between gap-3 border-b border-line-soft py-1 pl-3.5 pr-1.5 last:border-b-0">
                <dt className="text-ink-2">Số tài khoản</dt>
                <dd className="flex items-center gap-1">
                  <b className="font-bold tabular-nums">{payment.accountNumber}</b>
                  <button
                    type="button"
                    onClick={copyAccount}
                    className="h-10 rounded-sm px-2.5 text-[13px] font-bold text-primary"
                  >
                    {copied ? 'Đã chép' : 'Sao chép'}
                  </button>
                </dd>
              </div>
            )}
            {payment.accountName && (
              <div className="flex justify-between gap-3 px-3.5 py-2.5">
                <dt className="text-ink-2">Chủ tài khoản</dt>
                <dd className="font-semibold">{payment.accountName}</dd>
              </div>
            )}
          </dl>
        )}

        <div className="px-5 pb-5 pt-4">
          <button
            type="button"
            onClick={close}
            className="h-[50px] w-full rounded-pill bg-primary font-bold text-on-primary"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
