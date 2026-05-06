import ClassCard from '@/components/dashboard/ClassCard';

const CLASSES = [
  {
    title: 'HN26_FR_ReactJS_01',
    subTitle: 'FSA LDC Class Master',
    teacher: 'Code Your Life',
    bannerBg: 'bg-slate-700',
    avatar: 'https://i.pravatar.cc/150?u=1',
  },
  {
    title: 'MLN131_SE1827-NJ',
    subTitle: 'Kieu Nam',
    teacher: 'Kieu Nam',
    bannerBg: 'bg-blue-600',
    avatar: 'https://i.pravatar.cc/150?u=2',
  },
  {
    title: 'FU-SU25-MMA301-SE1...',
    subTitle: 'Nguyễn Quang Hưng',
    teacher: 'Nguyễn Quang Hưng',
    bannerBg: 'bg-teal-600',
    avatar: 'https://i.pravatar.cc/150?u=3',
  },
  {
    title: 'SE1827_MLN111',
    subTitle: 'Dinh Xuan Tung QP0721',
    teacher: 'Dinh Xuan Tung',
    bannerBg: 'bg-gray-500',
    avatar: 'https://i.pravatar.cc/150?u=4',
  },
];

export default function StudentDashboardPage() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {CLASSES.map((item, idx) => (
        <ClassCard key={idx} {...item} />
      ))}
    </div>
  );
}
