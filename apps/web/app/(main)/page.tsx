'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  BarChart3,
  Code2,
  Shield,
  Sparkles,
  Users,
  Zap,
  Calendar,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';
import { Problem, problemsApi } from '@/services/problem.apis';
import { Contest, contestsApi } from '@/services/contest.apis';
import LandingClient from '@/components/shared/LandingClient';

export default function HomePage() {
  const [featuredProblems, setFeaturedProblems] = useState<Problem[]>([]);
  const [upcomingContests, setUpcomingContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [problemsResult, contestsResult] = await Promise.all([
          problemsApi.findAll({ limit: 6 }),
          contestsApi.findAll({ limit: 3 }),
        ]);
        setFeaturedProblems(problemsResult.items);
        setUpcomingContests(contestsResult.items);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);
  return (
    <LandingClient/>
  );
}
