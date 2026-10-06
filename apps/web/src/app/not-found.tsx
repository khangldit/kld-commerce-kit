import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-[520px] px-4 py-24 text-center">
      <h1 className="mb-2 font-head text-3xl font-extrabold">Không tìm thấy trang</h1>
      <p className="mb-6 text-ink-2">Trang bạn tìm không tồn tại hoặc đã được chuyển.</p>
      <Link
        href="/"
        className="inline-grid h-[52px] place-items-center rounded-pill bg-primary px-7 font-bold text-on-primary no-underline"
      >
        Xem menu
      </Link>
    </main>
  );
}
