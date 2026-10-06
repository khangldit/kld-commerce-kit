import { formatPhone, formatVnd, telHref } from '@/lib/format';
import { StoreLink } from '@/components/store-link';

export interface OrderSuccess {
  code: string;
  /** Server-computed total */
  total: number;
  /** Some items have a price range / market price → total is a minimum. */
  estimate: boolean;
  count: number;
  mode: string;
  headline: string;
  /** Absent for orders placed at the table. */
  phone?: string;
  address?: string;
  delivery: boolean;
  /** Placed from a table QR: no call-back, deposit or store phone needed. */
  atTable: boolean;
}

export function SuccessView({
  order,
  storePhone,
}: {
  order: OrderSuccess;
  storePhone: string;
}) {
  return (
    <div className="mx-auto max-w-[560px] px-4 pb-12 pt-7 sm:px-6">
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-panel">
        <div className="bg-primary px-6 pb-[22px] pt-[30px] text-center text-on-primary">
          <div
            aria-hidden
            className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-on-primary text-[28px] font-bold text-primary"
          >
            ✓
          </div>
          <h1 className="mb-1 font-head text-[26px] font-extrabold">
            Đã gửi đơn cho quán!
          </h1>
          <div className="text-sm opacity-85">{order.headline}</div>
        </div>

        <div className="px-6 pb-2 pt-[22px] text-center">
          <div className="text-[13px] font-semibold uppercase tracking-[.12em] text-ink-2">
            Mã đơn
          </div>
          <div className="mt-1 font-head text-[46px] font-extrabold leading-[1.1] tracking-[.02em] tabular-nums">
            {order.code}
          </div>
          <div className="mt-1 text-[13px] text-ink-2">
            {order.atTable
              ? 'Báo mã này cho nhân viên nếu cần'
              : 'Đọc mã này khi quán gọi lại'}
          </div>
        </div>

        <div className="mx-6 mt-4 border-t-2 border-dashed border-line" />
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 px-6 py-3.5 text-[14.5px]">
          <dt className="text-ink-2">Hình thức</dt>
          <dd className="text-right font-semibold">{order.mode}</dd>
          {order.address && (
            <>
              <dt className="text-ink-2">Giao đến</dt>
              <dd className="text-right font-semibold">{order.address}</dd>
            </>
          )}
          <dt className="text-ink-2">Số món</dt>
          <dd className="text-right font-semibold">{order.count} món</dd>
          {order.phone && (
            <>
              <dt className="text-ink-2">Điện thoại</dt>
              <dd className="text-right font-semibold">{formatPhone(order.phone)}</dd>
            </>
          )}
        </dl>
        <div className="mx-6 flex items-baseline justify-between border-t border-line-soft py-3.5">
          <span className="font-semibold">
            {order.estimate ? 'Tạm tính (từ)' : 'Tổng cộng'}
          </span>
          <span className="font-head text-[26px] font-extrabold text-price">
            {formatVnd(order.total)}
          </span>
        </div>
        {!order.atTable && (
        <div className="mx-6 mt-1 rounded-md bg-warn-soft px-3.5 py-3 text-sm text-pretty">
          {order.delivery
            ? 'Quán sẽ gọi lại để xác nhận đơn, báo phí giao hàng và hướng dẫn đặt cọc nếu cần.'
            : 'Quán sẽ gọi lại để xác nhận đơn và hướng dẫn đặt cọc nếu cần.'}
        </div>
        )}
        <div className="flex flex-col gap-2 px-6 pb-6 pt-[18px]">
          <StoreLink
            href="/"
            className="grid h-[52px] place-items-center rounded-pill bg-primary text-base font-bold text-on-primary no-underline hover:text-on-primary"
          >
            Về menu
          </StoreLink>
          {!order.atTable && (
          <a
            href={telHref(storePhone)}
            className="flex h-12 items-center justify-center rounded-pill border-[1.5px] border-line font-semibold text-ink no-underline"
          >
            Gọi quán · {formatPhone(storePhone)}
          </a>
          )}
        </div>
      </div>
    </div>
  );
}
