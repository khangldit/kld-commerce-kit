'use client';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-[520px] px-4 py-24 text-center">
      <h1 className="mb-2 font-head text-3xl font-extrabold">Có lỗi xảy ra</h1>
      <p className="mb-6 text-ink-2">Không tải được menu. Vui lòng thử lại sau giây lát.</p>
      <button
        type="button"
        onClick={reset}
        className="h-[52px] rounded-pill bg-primary px-7 font-bold text-on-primary"
      >
        Thử lại
      </button>
    </main>
  );
}
