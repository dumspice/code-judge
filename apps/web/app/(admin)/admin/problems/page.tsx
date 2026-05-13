import AdminProblemsTable from '@/components/admin/problems/admin-problems-table';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quản lý problem | Admin',
};

export default function AdminProblemsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Problems</h1>
        <p className="text-muted-foreground text-sm">
          Xem toàn bộ problem (kể cả chưa publish / private), tạo mới, sửa hoặc xóa.
        </p>
      </div>
      <AdminProblemsTable />
    </div>
  );
}
