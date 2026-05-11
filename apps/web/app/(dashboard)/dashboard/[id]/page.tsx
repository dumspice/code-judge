import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Button } from '@/components/ui/button';
import { getClassroomDetail } from '@/services/classroom.apis';
import { setAccessToken } from '@/services/auth.apis';
import { getPublicCoreUrl } from '@/lib/public-config';
import { Copy } from 'lucide-react';
import StreamPost from '@/components/dashboard/class-detail/stream-post';
import Link from 'next/link';
import Image from 'next/image';
import { getClassroomBannerColor } from '@/lib/classroom-banner';

export const metadata: Metadata = {
  title: 'Class Stream | CodeJudge',
  description: 'View class announcements and stream',
};

export default async function ClassStreamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const BASE_URL = getPublicCoreUrl();
  const bannerBg = getClassroomBannerColor(id);

  // Refresh token on server side
  try {
    const cookieStore = await cookies();
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieStore.toString(),
      },
      credentials: 'include',
    });

    if (res.ok) {
      const data = await res.json();
      const result = data.result ?? data;
      setAccessToken(result.accessToken);
    }
  } catch (error) {
    console.warn('Failed to refresh token on server:', error);
  }

  // Fetch classroom details
  const classroom = await getClassroomDetail(id);

  const posts = [
    {
      id: 1,
      author: 'Anh Tú Vũ',
      time: '29 thg 4',
      content: 'Đã đăng một bài tập mới: Đề thi lý thuyết ORM',
      type: 'assignment' as const,
    },
    {
      id: 2,
      author: 'Anh Tú Vũ',
      time: '29 thg 4',
      content: 'Đã đăng một bài tập mới: Đề thi lý thuyết NestJS',
      type: 'assignment' as const,
    },
    {
      id: 3,
      author: 'Anh Tú Vũ',
      time: '16 thg 4',
      content: 'Đã đăng một bài tập mới: Elevator pitch deck about mock project',
      type: 'assignment' as const,
    },
    {
      id: 4,
      author: 'Tú Phạm',
      time: '14 thg 4',
      content: 'Đã đăng một bài tập mới: CV',
      type: 'assignment' as const,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Banner */}
      <div
        className={`h-48 md:h-64 rounded-xl ${bannerBg} flex flex-col justify-end p-6 text-white relative overflow-hidden shadow-md`}
      >
        {/* Decorative elements for the banner (abstract shapes) */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute left-1/4 bottom-0 w-32 h-32 bg-white opacity-5 rounded-full translate-y-1/2"></div>

        <h1 className="text-3xl md:text-4xl font-semibold z-10">{classroom.name}</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column (Upcoming) */}
        <div className="w-full lg:w-56 flex-shrink-0">
          {classroom.owner && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm mb-4">
              <h2 className="font-semibold text-gray-900 mb-2">Class code</h2>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{classroom.classCode}</p>
                <Button className="cursor-pointer" variant="outline" size="icon">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-2">Incoming Test</h2>
            <p className="text-sm text-gray-500 mb-4">Great, there are no incoming test!</p>

            <div className="flex justify-end">
              <Button
                variant="link"
                className="p-0 h-auto text-black font-semibold hover:no-underline hover:text-gray-700 cursor-pointer"
                asChild
              >
                <Link href={`/dashboard/${id}/classwork`}>View all classwork</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column (Feed) */}
        <div className="flex-1 w-full space-y-4">
          {/* Announce something to your class box */}
          {classroom.owner && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex items-center gap-4 cursor-text hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-semibold flex-shrink-0">
                <Image
                  src={classroom.owner.image || '/default-avatar.png'}
                  alt={classroom.owner.name}
                  width={40}
                  height={40}
                  className="rounded-full border-0 border-white"
                />
              </div>
              <p className="text-gray-500 text-sm">Announce the content for your class.</p>
            </div>
          )}

          {/* Posts List */}
          <div className="space-y-4">
            {posts.map((post) => (
              <StreamPost key={post.id} {...post} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
