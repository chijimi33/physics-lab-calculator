import Link from "next/link";
import { experiments } from "@/experiments";

export default function Home() {
  const statusLabels = {
    stable: "安定",
    beta: "確認中",
    todo: "未実装",
  };

  return (
    <main className="min-h-screen px-3 py-5 sm:px-5 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-4 border-b border-rule px-1 pb-4">
          <h1 className="text-2xl font-semibold text-ink sm:text-3xl">
            大学物理学実験 計算支援
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
            測定値、有効数字、平均値、誤差、誤差伝播を物理実験のルールに沿って処理します。
          </p>
        </header>

        <section className="border border-rule bg-white">
          {experiments.map((experiment) => (
            <Link
              key={experiment.id}
              href={`/experiments/${experiment.slug}`}
              className="block border-b border-rule px-4 py-4 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent last:border-b-0"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    {experiment.displayNumber ?? String(experiment.number)} 実験
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-ink">
                    {experiment.title}
                  </h2>
                </div>
                <span className="border border-rule bg-slate-50 px-2 py-1 text-sm font-semibold text-accent">
                  開く
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                {experiment.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="border border-rule bg-slate-50 px-2 py-1 text-slate-700">
                  {statusLabels[experiment.status ?? "stable"]}
                </span>
                <span className="border border-rule bg-slate-50 px-2 py-1 text-slate-700">
                  グラフ {experiment.graphDefinitions?.length ? "対応" : "未対応"}
                </span>
                {experiment.lastUpdated ? (
                  <span className="border border-rule bg-slate-50 px-2 py-1 text-slate-700">
                    更新 {experiment.lastUpdated}
                  </span>
                ) : null}
                {experiment.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="border border-rule bg-slate-50 px-2 py-1 text-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
