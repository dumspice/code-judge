'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ClassProblemCreate from '@/components/dashboard/class-detail/ClassProblemCreate';
import { listClassroomsForAdmin } from '@/services/classroom.apis';
import { Loader2 } from 'lucide-react';

function AdminProblemNewInner() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [classOptions, setClassOptions] = useState<
    { id: string; name: string; classCode: string }[] | null
  >(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (editId) return;
    let cancelled = false;
    listClassroomsForAdmin({ limit: 100 })
      .then((res) => {
        if (cancelled) return;
        setClassOptions(
          res.items.map((r) => ({ id: r.id, name: r.name, classCode: r.classCode })),
        );
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [editId]);

  if (editId) {
    return (
      <div className="p-4 pt-6 md:p-8">
        <ClassProblemCreate adminPortal />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 pt-6 md:p-8 text-destructive text-sm">
        Không tải được danh sách lớp. Thử tải lại trang hoặc kiểm tra quyền admin.
      </div>
    );
  }

  if (classOptions === null) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Đang tải danh sách lớp...</p>
      </div>
    );
  }

  return (
    <div className="p-4 pt-6 md:p-8">
      <ClassProblemCreate adminPortal adminClassRoomOptions={classOptions} />
    </div>
  );
}

export default function AdminProblemNewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Đang tải...</p>
        </div>
      }
    >
      <AdminProblemNewInner />
    </Suspense>
  );
}
