'use client';

import {
  MAX_ADDRESS_LENGTH,
  MAX_ORDER_NOTE_LENGTH,
  MAX_PARTY_SIZE,
  vnPhoneSchema,
  type CreateOrderRequestInput,
  type Fulfillment,
} from '@kld/shared';
import type { ScheduleConfig } from '@brands/types';
import { StoreLink } from '@/components/store-link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { EmptyMark, SectionCard, Spinner, Stepper } from '@/components/ui';
import { isPriceEstimate } from '@/lib/format';
import { clearIdempotencyKey, idempotencyKeyFor } from '@/lib/idempotency';
import {
  invalidFields,
  submitOrder,
  unavailableProductIds,
  warmUpApi,
} from '@/lib/order-client';
import { buildScheduleDays, toScheduledAt } from '@/lib/schedule';
import { TABLE_PARAM, tableNotePrefix } from '@/lib/table-mode';
import { useCart } from '@/stores/cart';
import { useUi } from '@/stores/ui';
import { OrderSummary } from './order-summary';
import { SuccessView, type OrderSuccess } from './success-view';

type When = 'now' | 'later';
/** Request body before the idempotency key is attached (Omit kept per union member). */
type OrderBody = CreateOrderRequestInput extends infer T
  ? T extends unknown
    ? Omit<T, 'idempotencyKey'>
    : never
  : never;
type FieldError = 'phone' | 'address' | 'slot' | 'form';
type Errors = Partial<Record<FieldError, string>>;

/** Show a "server is waking up" hint when sending takes this long. */
const SLOW_HINT_MS = 6000;

const INPUT =
  'w-full rounded-md border-[1.5px] bg-surface px-3.5 text-base text-ink outline-none placeholder:text-ink-3 focus:border-primary';

export function Checkout({
  storeSlug,
  storeName,
  storePhone,
  monogram,
  schedule,
}: {
  storeSlug: string;
  storeName: string;
  storePhone: string;
  monogram: string;
  schedule: ScheduleConfig;
}) {
  const hydrated = useCart((s) => s.hydrated);
  const lines = useCart((s) => s.lines);
  const soldOut = useCart((s) => s.soldOut);
  const table = useUi((s) => s.table);

  const [fulfillment, setFulfillment] = useState<Fulfillment>('dine_in');
  const [when, setWhen] = useState<When>('now');
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [partySize, setPartySize] = useState(2);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [slow, setSlow] = useState(false);
  const [netError, setNetError] = useState(false);
  const [success, setSuccess] = useState<OrderSuccess | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Wake the API while the customer fills the form (Render cold start)
  useEffect(() => warmUpApi(), []);

  // Recomputed when "later" is picked so today's past slots drop off
  const days = useMemo(
    () => (when === 'later' ? buildScheduleDays(schedule) : []),
    [schedule, when],
  );
  const selectedDay = days.find((d) => d.key === dayKey) ?? days[0];

  const tableMode = table !== null;
  const dineIn = tableMode || fulfillment === 'dine_in';
  const later = !tableMode && when === 'later';
  const notePrefix = table ? tableNotePrefix(table) : '';
  const noteMax = MAX_ORDER_NOTE_LENGTH - notePrefix.length;
  const blocked = lines.some((l) => soldOut.includes(l.productId));

  if (success) {
    return (
      <>
        <OrderHeader title="Đơn đã gửi" storeName={storeName} />
        <SuccessView order={success} storePhone={storePhone} />
      </>
    );
  }

  function clearError(field: FieldError) {
    setErrors((e) => ({ ...e, [field]: undefined, form: undefined }));
  }

  function validate(): Errors {
    const next: Errors = {};
    // At the table the staff can see the customer — no phone needed
    if (tableMode) {
      // nothing to check
    } else if (!phone.trim()) {
      next.phone = 'Vui lòng nhập số điện thoại để quán gọi lại.';
    } else if (!vnPhoneSchema.safeParse(phone).success) {
      next.phone = 'Số điện thoại chưa đúng — cần 10 số, bắt đầu bằng 0.';
    }
    if (later && (!selectedDay || !slot || !selectedDay.slots.includes(slot))) {
      next.slot = dineIn ? 'Chọn giờ bạn sẽ đến.' : 'Chọn giờ giao hàng.';
    }
    if (!dineIn && address.trim().length < 5) {
      next.address = 'Vui lòng nhập địa chỉ giao hàng.';
    }
    return next;
  }

  function buildBody(): OrderBody {
    const items = lines
      .filter((l) => !soldOut.includes(l.productId))
      .map((l) => ({ productId: l.productId, qty: l.qty }));
    const fullNote = (notePrefix + note.trim()).trim();
    const base = {
      name: (!tableMode && name.trim()) || undefined,
      note: fullNote || undefined,
      items,
    };
    const scheduledAt =
      later && selectedDay && slot ? toScheduledAt(selectedDay.key, slot) : undefined;
    return dineIn
      ? {
          ...base,
          fulfillment: 'dine_in',
          phone: tableMode ? undefined : phone.trim(),
          ...(scheduledAt ? { scheduledAt, partySize } : {}),
        }
      : {
          ...base,
          fulfillment: 'delivery',
          phone: phone.trim(),
          address: address.trim(),
          ...(scheduledAt ? { scheduledAt } : {}),
        };
  }

  function describe(): Pick<OrderSuccess, 'mode' | 'headline'> {
    if (tableMode) {
      return {
        mode: `Ăn tại quán · ${table}`,
        headline: 'Món sẽ được mang ra bàn sau khi quán xác nhận',
      };
    }
    const at = later && selectedDay && slot ? { day: selectedDay, slot } : null;
    if (dineIn) {
      return at
        ? {
            mode: `Đặt trước · ${at.day.short} · ${at.slot} · ${partySize} người`,
            headline: `Hẹn gặp bạn lúc ${at.slot}, ${at.day.top.toLowerCase()}`,
          }
        : { mode: 'Ăn tại quán · Bây giờ', headline: 'Quán đang chuẩn bị bàn cho bạn' };
    }
    return at
      ? {
          mode: `Giao tại nhà · ${at.day.short} · ${at.slot}`,
          headline: `Quán sẽ giao lúc ${at.slot}, ${at.day.top.toLowerCase()}`,
        }
      : {
          mode: 'Giao tại nhà · Sớm nhất có thể',
          headline: 'Quán sẽ gọi xác nhận rồi giao món cho bạn',
        };
  }

  function focusFirstError() {
    requestAnimationFrame(() => {
      formRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"], [data-error="true"]')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  async function submit() {
    if (sending) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusFirstError();
      return;
    }
    if (blocked) {
      document.getElementById('order-summary')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const body = buildBody();
    const idempotencyKey = idempotencyKeyFor(storeSlug, body);
    setSending(true);
    setNetError(false);
    const slowTimer = setTimeout(() => setSlow(true), SLOW_HINT_MS);
    const result = await submitOrder(storeSlug, { ...body, idempotencyKey });
    clearTimeout(slowTimer);
    setSending(false);
    setSlow(false);

    if (result.ok) {
      clearIdempotencyKey(storeSlug);
      setSuccess({
        ...describe(),
        code: result.order.code,
        total: result.order.total,
        estimate: result.order.items.some(isPriceEstimate),
        count: result.order.items.reduce((sum, item) => sum + item.qty, 0),
        phone: body.phone,
        address: body.fulfillment === 'delivery' ? body.address : undefined,
        delivery: body.fulfillment === 'delivery',
        atTable: tableMode,
      });
      useCart.getState().clear();
      window.scrollTo({ top: 0 });
      return;
    }

    if (result.kind === 'network') {
      setNetError(true);
      return;
    }

    const { error } = result;
    switch (error.code) {
      case 'PRODUCTS_UNAVAILABLE':
        useCart.getState().markSoldOut(unavailableProductIds(error));
        document.getElementById('order-summary')?.scrollIntoView({ behavior: 'smooth' });
        return;
      case 'VALIDATION_FAILED': {
        const fields = invalidFields(error);
        const next: Errors = {};
        if (fields.has('phone')) next.phone = 'Số điện thoại chưa đúng — cần 10 số, bắt đầu bằng 0.';
        if (fields.has('address')) next.address = 'Địa chỉ giao hàng chưa hợp lệ.';
        if (fields.has('scheduledAt') || fields.has('partySize')) {
          next.slot = 'Giờ đã chọn không còn hợp lệ, vui lòng chọn giờ khác.';
        }
        if (Object.keys(next).length === 0) {
          next.form = 'Thông tin đơn chưa hợp lệ. Vui lòng kiểm tra lại.';
        }
        setErrors(next);
        focusFirstError();
        return;
      }
      case 'STORE_NOT_FOUND':
      case 'NOT_FOUND':
        setErrors({ form: 'Quán đang tạm ngưng nhận đơn online. Vui lòng gọi quán.' });
        return;
      case 'RATE_LIMITED':
        setErrors({ form: 'Bạn gửi hơi nhanh. Vui lòng thử lại sau ít phút.' });
        return;
      default:
        setNetError(true);
    }
  }

  function exitTableMode() {
    // Drop `t` from the URL — from now on this is a remote order
    const url = new URL(window.location.href);
    url.searchParams.delete(TABLE_PARAM);
    window.history.replaceState(null, '', url);
    useUi.getState().setTable(null);
  }

  const header = <OrderHeader title="Đặt món" storeName={storeName} />;

  if (!hydrated) {
    return (
      <>
        {header}
        <div className="mx-auto max-w-[680px] px-4 py-16 text-center text-ink-2">
          Đang tải giỏ hàng...
        </div>
      </>
    );
  }

  if (lines.length === 0) {
    return (
      <>
        {header}
        <div className="mx-auto max-w-[680px] px-4 pb-10 pt-4 sm:px-6">
          <div className="mx-auto mt-6 max-w-[520px] rounded-lg border border-line bg-surface px-6 py-11 text-center">
            <EmptyMark monogram={monogram} size="lg" />
            <h2 className="mb-1.5 font-head text-[22px] font-bold">Chưa có món nào</h2>
            <p className="mb-5 text-ink-2">
              Chọn vài món ngon trong menu rồi quay lại đây để gửi đơn nhé.
            </p>
            <StoreLink
              href="/"
              className="inline-grid h-[52px] place-items-center rounded-pill bg-primary px-7 text-base font-bold text-on-primary no-underline hover:text-on-primary"
            >
              Xem menu
            </StoreLink>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {header}
      <div className="mx-auto max-w-[680px] px-4 pb-10 pt-4 sm:px-6 lg:max-w-[1120px] lg:px-8">
        {tableMode && (
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <span className="inline-flex h-9 items-center gap-1.5 rounded-pill bg-primary px-3.5 text-sm font-bold text-on-primary">
              📍 {table}
            </span>
            <button
              type="button"
              onClick={exitTableMode}
              className="py-2.5 text-[13px] text-ink-2 underline"
            >
              Không phải đang ở quán?
            </button>
          </div>
        )}

        <form
          ref={formRef}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          // Mobile: one column ordered summary → fulfillment → contact → submit.
          // Desktop: two independent columns, so a long summary never leaves a
          // gap under the fulfillment card (wrappers are `contents` on mobile).
          className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start"
        >
          <div className="contents lg:flex lg:flex-col lg:gap-4">
          {/* Fulfillment */}
          <SectionCard className="order-2 flex flex-col gap-3.5 px-[18px] pb-[18px] pt-4">
            <h2 className="font-head text-xl font-bold">Hình thức</h2>
            {tableMode ? (
              <div className="flex items-center justify-between gap-3 rounded-md bg-primary-soft px-3.5 py-3 text-primary">
                <span className="font-bold">Ăn tại quán — Bây giờ</span>
                <span className="whitespace-nowrap text-xs font-semibold opacity-80">
                  Theo bàn đã quét
                </span>
              </div>
            ) : (
              <>
                <div
                  role="radiogroup"
                  aria-label="Hình thức"
                  className="grid grid-cols-2 gap-1 rounded-md bg-bg-sunk p-1"
                >
                  {(
                    [
                      ['dine_in', 'Ăn tại quán'],
                      ['delivery', 'Đặt giao tại nhà'],
                    ] as const
                  ).map(([value, label]) => {
                    const on = fulfillment === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => {
                          setFulfillment(value);
                          clearError('slot');
                        }}
                        className={`h-11 rounded-[9px] px-2 font-bold ${
                          on
                            ? 'bg-surface text-ink shadow-[0_1px_3px_rgba(42,30,21,.15)]'
                            : 'text-ink-2'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div role="radiogroup" aria-label="Thời gian" className="flex flex-wrap gap-2">
                  {(
                    [
                      ['now', dineIn ? 'Bây giờ' : 'Sớm nhất có thể'],
                      ['later', dineIn ? 'Đặt trước' : 'Chọn giờ giao'],
                    ] as const
                  ).map(([value, label]) => {
                    const on = when === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => {
                          setWhen(value);
                          clearError('slot');
                        }}
                        className={`flex h-11 items-center gap-2 rounded-pill border-[1.5px] px-4 font-semibold ${
                          on
                            ? 'border-primary bg-primary-soft text-primary'
                            : 'border-line bg-surface text-ink'
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`size-4 rounded-full border-2 ${
                            on
                              ? 'border-primary bg-primary shadow-[inset_0_0_0_3px_var(--c-primary-soft)]'
                              : 'border-line'
                          }`}
                        />
                        {label}
                      </button>
                    );
                  })}
                </div>

                {later && (
                  <>
                    <div>
                      <div className="mb-2 text-sm font-semibold">Ngày</div>
                      <div className="no-scrollbar -mx-[18px] flex gap-2 overflow-x-auto px-[18px]">
                        {days.map((day) => {
                          const on = day.key === selectedDay?.key;
                          return (
                            <button
                              key={day.key}
                              type="button"
                              aria-pressed={on}
                              onClick={() => {
                                setDayKey(day.key);
                                if (slot && !day.slots.includes(slot)) setSlot(null);
                              }}
                              className={`flex h-[60px] w-[72px] flex-none flex-col items-center justify-center gap-px rounded-md border-[1.5px] ${
                                on
                                  ? 'border-primary bg-primary text-on-primary'
                                  : 'border-line bg-surface text-ink'
                              }`}
                            >
                              <span className="text-xs font-semibold opacity-85">
                                {day.top}
                              </span>
                              <span className="font-bold">{day.date}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div data-error={Boolean(errors.slot)}>
                      <div className="mb-2 text-sm font-semibold">
                        {dineIn ? 'Giờ đến' : 'Giờ giao'}
                      </div>
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-1.5">
                        {selectedDay?.slots.map((s) => {
                          const on = s === slot;
                          return (
                            <button
                              key={s}
                              type="button"
                              aria-pressed={on}
                              onClick={() => {
                                setSlot(s);
                                if (!dayKey && selectedDay) setDayKey(selectedDay.key);
                                clearError('slot');
                              }}
                              className={`h-11 rounded-sm border-[1.5px] font-semibold tabular-nums ${
                                on
                                  ? 'border-primary bg-primary text-on-primary'
                                  : errors.slot
                                    ? 'border-[rgba(180,35,24,.45)] bg-surface text-ink'
                                    : 'border-line bg-surface text-ink'
                              }`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                      {errors.slot && <FieldErrorText>{errors.slot}</FieldErrorText>}
                    </div>

                    {dineIn && (
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold">Số người</div>
                          <div className="text-[13px] text-ink-2">
                            Để quán xếp bàn phù hợp
                          </div>
                        </div>
                        <Stepper
                          variant="outline"
                          label="người"
                          minWidth="min-w-7"
                          value={partySize}
                          onDecrement={() => setPartySize((n) => Math.max(1, n - 1))}
                          onIncrement={() =>
                            setPartySize((n) => Math.min(MAX_PARTY_SIZE, n + 1))
                          }
                        />
                      </div>
                    )}
                  </>
                )}

                {!dineIn && (
                  <div>
                    <label htmlFor="address" className="mb-1.5 block text-sm font-semibold">
                      Địa chỉ giao hàng <span className="text-accent">*</span>
                    </label>
                    <textarea
                      id="address"
                      rows={2}
                      maxLength={MAX_ADDRESS_LENGTH}
                      value={address}
                      autoComplete="street-address"
                      aria-invalid={Boolean(errors.address)}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        clearError('address');
                      }}
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện"
                      className={`${INPUT} block resize-y py-3 ${
                        errors.address ? 'border-danger bg-danger-soft' : 'border-line'
                      }`}
                    />
                    {errors.address && <FieldErrorText>{errors.address}</FieldErrorText>}
                  </div>
                )}
              </>
            )}
          </SectionCard>

          {/* Contact */}
          <SectionCard className="order-3 flex flex-col gap-4 px-[18px] pb-[18px] pt-4">
            <h2 className="font-head text-xl font-bold">
              {tableMode ? 'Ghi chú cho quán' : 'Thông tin liên hệ'}
            </h2>
            {!tableMode && (
            <>
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold">
                Số điện thoại <span className="text-accent">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                aria-invalid={Boolean(errors.phone)}
                onChange={(e) => {
                  setPhone(e.target.value);
                  clearError('phone');
                }}
                placeholder="09xx xxx xxx"
                className={`${INPUT} h-12 ${
                  errors.phone ? 'border-danger bg-danger-soft' : 'border-line'
                }`}
              />
              {errors.phone && <FieldErrorText>{errors.phone}</FieldErrorText>}
            </div>
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-semibold">
                Tên <span className="font-normal text-ink-2">(không bắt buộc)</span>
              </label>
              <input
                id="name"
                autoComplete="name"
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Quán nên gọi bạn là gì?"
                className={`${INPUT} h-12 border-line`}
              />
            </div>
            </>
            )}
            <div>
              <label
                htmlFor="note"
                className={tableMode ? 'sr-only' : 'mb-1.5 block text-sm font-semibold'}
              >
                Ghi chú <span className="font-normal text-ink-2">(không bắt buộc)</span>
              </label>
              <div className="rounded-md border-[1.5px] border-line bg-surface px-3.5 py-2.5 focus-within:border-primary">
                {table && (
                  <div className="mb-1.5 inline-block rounded-[6px] bg-primary-soft px-2 py-0.5 text-[13px] font-bold text-primary">
                    [{table}]
                  </div>
                )}
                <textarea
                  id="note"
                  rows={3}
                  maxLength={noteMax}
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, noteMax))}
                  placeholder="Ví dụ: ít cay, thêm đá, có em bé..."
                  className="block min-h-[66px] w-full resize-y border-0 bg-transparent p-0 text-base text-ink outline-none placeholder:text-ink-3"
                />
              </div>
              <div className="mt-1.5 flex justify-between gap-2 text-[12.5px] text-ink-2">
                <span>{table ? 'Số bàn được gửi kèm tự động' : ''}</span>
                <span className="tabular-nums">
                  {notePrefix.length + note.length}/{MAX_ORDER_NOTE_LENGTH}
                </span>
              </div>
            </div>
          </SectionCard>
          </div>

          <div className="contents lg:sticky lg:top-[calc(var(--header-h)+16px)] lg:flex lg:flex-col lg:gap-4">
          <OrderSummary atTable={tableMode} />

          {/* Submit */}
          <section className="order-4 flex flex-col gap-2.5">
            {errors.form && (
              <div
                role="alert"
                className="rounded-md border border-[rgba(180,35,24,.25)] bg-danger-soft px-3.5 py-3 text-sm text-danger"
              >
                {errors.form}
              </div>
            )}
            {netError && (
              <div
                role="alert"
                className="flex items-center justify-between gap-3 rounded-md border border-[rgba(180,35,24,.25)] bg-danger-soft px-3.5 py-3"
              >
                <div className="text-sm leading-[1.35] text-danger">
                  <b>Không gửi được đơn.</b>
                  <br />
                  Kiểm tra mạng rồi thử lại nhé.
                </div>
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={sending}
                  className="h-11 flex-none rounded-pill bg-danger px-4 font-bold text-white"
                >
                  Thử lại
                </button>
              </div>
            )}
            <button
              type="submit"
              disabled={sending}
              className={`flex h-14 items-center justify-center gap-2.5 rounded-pill bg-accent text-[17px] font-bold text-on-accent shadow-[0_10px_24px_-12px_rgba(196,71,29,.7)] ${
                sending ? 'opacity-80' : 'hover:opacity-95'
              }`}
            >
              {sending && <Spinner />}
              {sending ? 'Đang gửi đơn...' : 'Gửi đơn'}
            </button>
            {slow && (
              <p className="text-center text-[13px] text-ink-2" aria-live="polite">
                Máy chủ đang khởi động, vui lòng đợi thêm chút...
              </p>
            )}
            <p className="text-center text-[13.5px] text-pretty text-ink-2">
              {tableMode
                ? 'Món sẽ được mang ra bàn sau khi quán xác nhận.'
                : dineIn
                ? 'Quán sẽ gọi lại để xác nhận đơn và hướng dẫn đặt cọc nếu cần.'
                : 'Quán sẽ gọi lại để xác nhận đơn, báo phí giao hàng và hướng dẫn đặt cọc nếu cần.'}
            </p>
          </section>
          </div>
        </form>
      </div>
    </>
  );
}

function FieldErrorText({ children }: { children: string }) {
  return (
    <div role="alert" className="mt-1.5 text-[13px] font-medium text-danger">
      ⚠ {children}
    </div>
  );
}

function OrderHeader({ title, storeName }: { title: string; storeName: string }) {
  return (
    <header className="sticky top-0 z-20 h-[var(--header-h)] border-b border-line bg-surface">
      <div className="mx-auto flex h-full max-w-[680px] items-center gap-2 px-4 sm:px-6 lg:max-w-[1120px] lg:px-8">
        <StoreLink
          href="/"
          className="-ml-2 flex h-11 items-center gap-1.5 rounded-pill pl-2 pr-3.5 font-semibold text-ink no-underline"
        >
          <span aria-hidden className="text-xl leading-none">
            ‹
          </span>
          Menu
        </StoreLink>
        <h1 className="flex-1 text-center font-head text-lg font-bold">{title}</h1>
        <div className="w-20 text-right text-xs leading-[1.2] text-ink-2">{storeName}</div>
      </div>
    </header>
  );
}
