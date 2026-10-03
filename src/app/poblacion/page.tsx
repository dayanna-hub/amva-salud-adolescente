import { PageHeader } from "@/components/PageHeader";
import { PopulationSummary } from "@/components/PopulationSummary";

export default function PopulationPage() {
  return <>
    <PageHeader title="Base poblacional" description="Población adolescente por municipio, año, edad y sexo. Funciona como denominador para tasas e indicadores." />
    <PopulationSummary />
  </>;
}
