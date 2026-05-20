import { notFound, redirect } from "next/navigation";
import { experiments } from "@/experiments";
import { ExperimentRunner } from "@/components/experiment-runner";

type ExperimentPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ExperimentPage({ params }: ExperimentPageProps) {
  const { slug } = await params;
  const experiment = experiments.find(
    (item) => item.slug === slug || item.legacySlugs?.includes(slug),
  );

  if (!experiment) {
    notFound();
  }

  if (slug !== experiment.slug) {
    redirect(`/experiments/${experiment.slug}`);
  }

  return <ExperimentRunner slug={experiment.slug} />;
}
