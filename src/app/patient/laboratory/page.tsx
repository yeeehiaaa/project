import LaboratoryHero from "@/components/laboratory/LaboratoryHero";
import LaboratoryStats from "@/components/laboratory/LaboratoryStats";
import LaboratoryFilters from "@/components/laboratory/LaboratoryFilters";
import RecentTestsTable from "@/components/laboratory/RecentTestsTable";
import ResultsOverview from "@/components/laboratory/ResultsOverview";
import HealthTrendChart from "@/components/laboratory/HealthTrendChart";
import AIInterpretationCard from "@/components/laboratory/AIInterpretationCard";
import UploadedReports from "@/components/laboratory/UploadedReports";
import LaboratoryCalendar from "@/components/laboratory/LaboratoryCalendar";
import CompareResults from "@/components/laboratory/CompareResults";
import CriticalAlerts from "@/components/laboratory/CriticalAlerts";

export default function LaboratoryPage() {
  return (
    <div className="space-y-8">

      <LaboratoryHero />

      <LaboratoryStats />

      <LaboratoryFilters />

      <RecentTestsTable />

      <ResultsOverview />

      <HealthTrendChart />

      <AIInterpretationCard />

      <UploadedReports />

      <LaboratoryCalendar />

      <CompareResults />

      <CriticalAlerts />

    </div>
  );
}