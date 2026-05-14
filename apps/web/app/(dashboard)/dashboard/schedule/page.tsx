import SchedulePageContent from '@/components/dashboard/schedule/SchedulePageContent';

type Props = {
  searchParams: {
    filter?: string;
  };
};

export default function SchedulePage({ searchParams }: Props) {
  return <SchedulePageContent filter={searchParams.filter} />;
}
