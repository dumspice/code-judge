// import { Suspense } from 'react';
// import { useSearchParams } from 'next/navigation';
import { startOfWeek, addDays, isSameDay, parseISO, format } from 'date-fns';
import { enUS } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

const MOCK_EVENTS = [
  { date: '2024-03-24', title: '1.todo-app-assignment-trainee', time: '23:59' },
  { date: '2024-03-26', title: '2.quiz-app-assignment-trainee', time: '23:59' },
];

export default function SchedulePage() {
  return <SchedulePageContent />;
}

function SchedulePageContent() {
  // const searchParams = useSearchParams();

  // // Đọc ngày từ URL tương tự như bên Navigation
  // const dateParam = searchParams.get('date');
  const currentDate = new Date(); // dateParam ? new Date(dateParam) : new Date();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

  const daysInWeek = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm h-full">
      <div className="grid grid-cols-7 divide-x divide-zinc-200 h-full min-h-[600px]">
        {daysInWeek.map((day, index) => {
          const dayEvents = MOCK_EVENTS.filter((e) => isSameDay(parseISO(e.date), day));

          return (
            <div key={index} className="flex flex-col min-h-full">
              {/* Header */}
              <div className="py-4 flex flex-col items-center border-b border-zinc-100">
                <span className="text-zinc-500 text-[12px] font-medium uppercase">
                  {format(day, 'EEE', { locale: enUS })}
                </span>
                <span className="text-2xl font-light">{format(day, 'd')}</span>
              </div>

              {/* Events */}
              <div className="p-2 flex-1 space-y-2">
                {dayEvents.map((event, idx) => (
                  <div key={idx} className="bg-[#1e1e20] text-white p-3 rounded text-[11px]">
                    <p className="font-medium mb-1">Bài tập: {event.title}</p>
                    <p className="text-zinc-400">{event.time}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
