'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { reportsApi } from '@/services/reports.apis';

type AdminExportKind = 'problem' | 'contest';

export function AdminExportReportButton({
  kind,
  problemId,
  contestId,
  label,
  variant = 'outline',
  size = 'sm',
}: {
  kind: AdminExportKind;
  problemId?: string;
  contestId?: string;
  label?: string;
  variant?: 'outline' | 'default' | 'secondary';
  size?: 'sm' | 'default';
}) {
  const [loading, setLoading] = useState(false);

  const defaultLabel =
    kind === 'problem' ? 'Xuất báo cáo bài' : 'Xuất báo cáo contest';

  const handleExport = async () => {
    setLoading(true);
    try {
      if (kind === 'problem' && problemId) {
        await reportsApi.downloadAdminProblemReport(problemId);
      } else if (kind === 'contest' && contestId) {
        await reportsApi.downloadAdminContestReport(contestId);
      } else {
        throw new Error('Thiếu tham số export');
      }
      toast.success('Đã tạo file báo cáo', {
        description: 'File XLSX đang được tải xuống.',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể xuất báo cáo';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={loading}
      onClick={handleExport}
      className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {label ?? defaultLabel}
    </Button>
  );
}
