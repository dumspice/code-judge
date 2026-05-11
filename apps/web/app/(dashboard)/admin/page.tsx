'use client';

import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import ProblemsTab from './ProblemsTab';
import ContestsTab from './ContestsTab';

export default function AdminPage() {
  return (
    <div style={{ padding: '20px 20px' }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage problems and contests</p>
        </div>
        <Button variant="secondary" size="sm" asChild>
          <Link href="/">Quay Trở Lại</Link>
        </Button>
      </div>

      <Tabs defaultValue="problems" className="w-full">
        <TabsList>
          <TabsTrigger value="problems">Problems</TabsTrigger>
          <TabsTrigger value="contests">Contests</TabsTrigger>
        </TabsList>
        <TabsContent value="problems">
          <ProblemsTab />
        </TabsContent>
        <TabsContent value="contests">
          <ContestsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
