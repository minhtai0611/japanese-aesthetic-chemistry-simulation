export default function DangTai() {
  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-28 sm:px-8" aria-busy="true" aria-label="Đang tải nguyên tố">
      <div className="mx-auto h-4 w-40 animate-pulse rounded-full bg-washi/10" />
      <div className="mx-auto mt-6 h-16 w-64 max-w-full animate-pulse rounded-2xl bg-washi/10" />
      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-washi/5" />
        ))}
      </div>
    </main>
  );
}
