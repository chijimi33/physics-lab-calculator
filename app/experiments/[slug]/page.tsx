import { notFound } from "next/navigation";
import { experiments } from "@/experiments";
import { ExperimentRunner } from "@/components/experiment-runner";

type ExperimentPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ExperimentPage({ params }: ExperimentPageProps) {
  const { slug } = await params;
  const experiment = experiments.find((item) => item.slug === slug);

  if (!experiment) {
    notFound();
  }

  return <ExperimentRunner slug={experiment.slug} />;
}
