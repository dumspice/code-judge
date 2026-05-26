'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { problemsApi } from '@/services/problem.apis';
import { ApiRequestError } from '@/services/api-client';
import { toast } from 'sonner';

type GenerateCodeTemplatesButtonProps = {
  title: string;
  statementMd: string;
  supportedLanguages: string[];
  onGenerated: (templates: Record<string, string>) => void;
  size?: 'sm' | 'default';
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
};

function pickTemplatesForLanguages(
  parsed: Record<string, string>,
  supportedLanguages: string[],
): Record<string, string> {
  const merged: Record<string, string> = {};
  const entries = Object.entries(parsed);

  for (const lang of supportedLanguages) {
    const match = entries.find(([key]) => key.trim().toUpperCase() === lang.trim().toUpperCase());
    if (match?.[1]?.trim()) {
      merged[lang] = match[1];
    }
  }

  return merged;
}

export function GenerateCodeTemplatesButton({
  title,
  statementMd,
  supportedLanguages,
  onGenerated,
  size = 'sm',
  variant = 'secondary',
  className,
}: GenerateCodeTemplatesButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    const trimmedTitle = title.trim();
    const trimmedStatement = statementMd.trim();

    if (!trimmedTitle) {
      toast.error('Nhập tiêu đề bài trước khi sinh template.');
      return;
    }
    if (!trimmedStatement) {
      toast.error('Nhập đề bài (Statement Markdown) trước khi sinh template.');
      return;
    }
    if (!supportedLanguages.length) {
      toast.error('Chọn ít nhất một ngôn ngữ hỗ trợ trong Configuration.');
      return;
    }

    setLoading(true);
    try {
      const result = await problemsApi.generateCodeTemplates({
        title: trimmedTitle,
        statement: trimmedStatement,
        languages: supportedLanguages,
        locale: 'vi',
      });

      if (!result.parsed) {
        toast.error(result.parseError ?? 'AI không trả về JSON template hợp lệ.');
        return;
      }

      const templates = pickTemplatesForLanguages(result.parsed, supportedLanguages);
      if (Object.keys(templates).length === 0) {
        toast.error('Không có template nào khớp ngôn ngữ đã chọn.');
        return;
      }

      onGenerated(templates);
      toast.success(
        `Đã sinh khung đọc input + hàm solve (chưa có logic) cho ${Object.keys(templates).length} ngôn ngữ.`,
      );
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Sinh template thất bại.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={loading}
      onClick={() => void handleGenerate()}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="mr-2 h-4 w-4" />
      )}
      Generate Code Templates
    </Button>
  );
}
