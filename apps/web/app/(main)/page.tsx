import LandingClient from '@/components/shared/LandingClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const cookieStore = await cookies();

  const refreshToken = cookieStore.get('refreshToken');

  if (refreshToken) {
    redirect('/dashboard');
  }

  return <LandingClient />;
}