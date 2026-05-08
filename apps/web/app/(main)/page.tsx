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
import { problemsApi, contestsApi, type Problem, type Contest } from '@/services/api';

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
    <>
      {/* Hero Section */}
      <section className="relative py-20 sm:py-32 lg:py-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div className="inline-block">
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                The Future of Programming Education
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight max-w-4xl mx-auto">
              Master Competitive Programming with AI
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Create intelligent contests, practice with auto-generated test cases, and compete with
              programmers worldwide. All in one powerful platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" asChild className="text-base">
                <Link href="/register">
                  Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="secondary" asChild className="text-base">
                <Link href="/submit">Submit Code</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base">
                <Link href="#features">Watch Demo</Link>
              </Button>
              <Button size="lg" variant="ghost" asChild className="text-base">
                <Link href="/admin">Admin Panel</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to teach, learn, and compete in programming
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 border border-border rounded-lg hover:border-primary transition hover:shadow-lg">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI-Powered Problem Creation</h3>
              <p className="text-muted-foreground">
                Upload problem statements and let AI generate comprehensive test cases
                automatically. Save hours on problem preparation.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 border border-border rounded-lg hover:border-primary transition hover:shadow-lg">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Auto-Judging</h3>
              <p className="text-muted-foreground">
                Secure sandboxed execution with configurable resource limits. Get results in
                seconds, not hours.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 border border-border rounded-lg hover:border-primary transition hover:shadow-lg">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">Classroom Management</h3>
              <p className="text-muted-foreground">
                Create classes, invite students with one-click links, and manage assignments
                seamlessly.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 border border-border rounded-lg hover:border-primary transition hover:shadow-lg">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <Code2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">Multi-Language Support</h3>
              <p className="text-muted-foreground">
                Support for C++, Java, Python, JavaScript and more. With syntax highlighting and
                advanced editor features.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 border border-border rounded-lg hover:border-primary transition hover:shadow-lg">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">Detailed Analytics</h3>
              <p className="text-muted-foreground">
                Track student progress, analyze problem difficulty, and export comprehensive
                reports.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 border border-border rounded-lg hover:border-primary transition hover:shadow-lg">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">Plagiarism Detection</h3>
              <p className="text-muted-foreground">
                AST-based code similarity detection to maintain academic integrity in your contests.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Explore Problems Section */}
      <section id="problems" className="py-20 sm:py-32 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Explore Problems</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Practice with our curated collection of programming problems
            </p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-muted rounded w-full mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProblems.map((problem) => (
                <Card key={problem.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg line-clamp-2">{problem.title}</CardTitle>
                      <Badge
                        variant={
                          problem.difficulty === 'EASY'
                            ? 'default'
                            : problem.difficulty === 'MEDIUM'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {problem.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        {problem.timeLimitMs}ms
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-4 h-4" />
                        {problem.memoryLimitMb}MB
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                      {problem.description || 'No description available'}
                    </p>
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link href={`/problems/${problem.id}`}>
                        Solve Problem <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button size="lg" variant="outline" asChild>
              <Link href="/problems">
                View All Problems <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Upcoming Contests Section */}
      <section id="contests" className="py-20 sm:py-32 border-t border-border bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Upcoming Contests</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join competitive programming contests and challenge yourself
            </p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-5 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3 mb-4"></div>
                    <div className="h-8 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {upcomingContests.map((contest) => (
                <Card key={contest.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{contest.title}</CardTitle>
                      <Badge variant={contest.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                        {contest.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(contest.startAt).toLocaleDateString()}</span>
                      <span>-</span>
                      <span>{new Date(contest.endAt).toLocaleDateString()}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                      {contest.description || 'No description available'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Trophy className="w-4 h-4" />
                          {contest.maxSubmissionsPerProblem || 'Unlimited'} submissions
                        </span>
                      </div>
                      <Button size="sm" asChild>
                        <Link href={`/contests/${contest.id}`}>
                          Join Contest <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button size="lg" variant="outline" asChild>
              <Link href="/contests">
                View All Contests <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* For Educators Section */}
      <section id="for-educators" className="py-20 sm:py-32 border-t border-border bg-secondary/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl sm:text-5xl font-bold">Built for Educators</h2>
              <p className="text-lg text-muted-foreground">
                Focus on teaching, not grading. CodeJudge handles the rest.
              </p>

              <ul className="space-y-4">
                <li className="flex gap-3">
                  <Zap className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <strong>Quick Contest Setup</strong>
                    <p className="text-muted-foreground">
                      Create exams in minutes with password protection and access control
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <BarChart3 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <strong>Real-time Dashboards</strong>
                    <p className="text-muted-foreground">
                      Monitor submissions live and see detailed statistics per problem
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Users className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <strong>Organization Management</strong>
                    <p className="text-muted-foreground">
                      Manage multiple instructors and problem repositories at scale
                    </p>
                  </div>
                </li>
              </ul>

              <Button size="lg" asChild>
                <Link href="/register?role=instructor">
                  Create Free Account <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
            <div className="hidden md:flex items-center justify-center">
              <div className="bg-primary rounded-lg p-1 shadow-2xl">
                <div className="bg-background rounded p-8 w-full">
                  <div className="space-y-4">
                    <div className="h-3 bg-muted w-2/3 rounded"></div>
                    <div className="h-3 bg-muted w-1/2 rounded"></div>
                    <div className="space-y-2 mt-6">
                      <div className="flex gap-2">
                        <div className="h-2 bg-muted w-1/4 rounded"></div>
                        <div className="h-2 bg-muted w-1/3 rounded"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-2 bg-muted w-1/3 rounded"></div>
                        <div className="h-2 bg-muted w-1/4 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Students Section */}
      <section id="for-students" className="py-20 sm:py-32 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="hidden md:flex items-center justify-center order-2">
              <div className="bg-secondary rounded-lg p-1 shadow-2xl">
                <div className="bg-background rounded p-8 w-full">
                  <div className="space-y-4">
                    <div className="h-3 bg-muted w-2/3 rounded"></div>
                    <div className="h-3 bg-muted w-1/2 rounded"></div>
                    <div className="space-y-2 mt-6">
                      <div className="flex gap-2">
                        <div className="h-2 bg-muted w-1/4 rounded"></div>
                        <div className="h-2 bg-muted w-1/3 rounded"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-2 bg-muted w-1/3 rounded"></div>
                        <div className="h-2 bg-muted w-1/4 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6 order-1">
              <h2 className="text-4xl sm:text-5xl font-bold">Perfect for Students</h2>
              <p className="text-lg text-muted-foreground">
                Practice, compete, and master programming
              </p>

              <ul className="space-y-4">
                <li className="flex gap-3">
                  <Code2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <strong>Vast Problem Library</strong>
                    <p className="text-muted-foreground">
                      Access thousands of problems from easy to hard with detailed explanations
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <Sparkles className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <strong>Instant Feedback</strong>
                    <p className="text-muted-foreground">
                      Get detailed test results to understand what went wrong immediately
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <BarChart3 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <strong>Track Your Progress</strong>
                    <p className="text-muted-foreground">
                      Monitor your improvement with detailed statistics and achievements
                    </p>
                  </div>
                </li>
              </ul>

              <Button size="lg" asChild>
                <Link href="/register?role=student">
                  Join the Community <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 border-t border-border bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-4xl sm:text-5xl font-bold">
            Ready to Transform Your Programming Education?
          </h2>
          <p className="text-lg opacity-90">
            Start building smarter contests and practice problems today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">Get Started Free</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-primary-foreground text-foreground hover:bg-primary-foreground hover:text-primary"
            >
              <Link href="#features">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}