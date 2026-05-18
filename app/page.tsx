import Link from "next/link";
import { experiments } from "@/experiments";

export default function Home() {
  const statusLabels = {
    stable: "安定",
    beta: "確認中",
    todo: "未実装",
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 border-b-2 border-ink pb-4">
          <p className="text-sm font-semibold tracking-[0.18em] text-slate-600">
            PHYSICS LABORATORY
          </p>
          <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">
            大学物理学実験 計算支援
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-700">
            測定値、有効数字、平均値、誤差、誤差伝播を物理実験のルールに沿って処理します。
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          {experiments.map((experiment) => (
            <Link
              key={experiment.id}
              href={`/experiments/${experiment.slug}`}
              className="group rounded border border-rule bg-paper p-5 shadow-report transition hover:-translate-y-0.5 hover:border-ink"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-600">
                    第{experiment.number}回実験
                  </p>
                  <h2 className="mt-2 text-xl font-bold text-ink">
                    {experiment.title}
                  </h2>
                </div>
                <span className="rounded border border-rule px-3 py-1 text-sm font-semibold text-accent group-hover:border-accent">
                  開く
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-700">
                {experiment.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded border border-rule bg-white px-2 py-1 text-slate-700">
                  {statusLabels[experiment.status ?? "stable"]}
                </span>
                <span className="rounded border border-rule bg-white px-2 py-1 text-slate-700">
                  グラフ {experiment.graphDefinitions?.length ? "対応" : "未対応"}
                </span>
                {experiment.lastUpdated ? (
                  <span className="rounded border border-rule bg-white px-2 py-1 text-slate-700">
                    更新 {experiment.lastUpdated}
                  </span>
                ) : null}
                {experiment.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-blue-700"
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
