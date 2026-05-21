'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { diffSupportedLanguages, applySupportedLanguagesWithDefaultTemplates } from '@/lib/starter-template-defaults';

type UseSupportedLanguagesWithTemplatesOptions = {
  supportedLanguages: string[];
  templateCode: Record<string, string>;
  testCases?: Array<{ input: string }>;
  activeTemplateLang: string;
  setActiveTemplateLang: (lang: string) => void;
  onUpdate: (patch: {
    supportedLanguages: string[];
    templateCode: Record<string, string>;
  }) => void;
};

export function useSupportedLanguagesWithTemplates({
  supportedLanguages,
  templateCode,
  testCases,
  activeTemplateLang,
  setActiveTemplateLang,
  onUpdate,
}: UseSupportedLanguagesWithTemplatesOptions) {
  const [loading, setLoading] = useState(false);

  const handleLanguagesChange = useCallback(
    async (nextLanguages: string[]) => {
      const previousLanguages = supportedLanguages;
      const { added } = diffSupportedLanguages(previousLanguages, nextLanguages);

      setLoading(true);
      try {
        const result = await applySupportedLanguagesWithDefaultTemplates({
          previousLanguages,
          nextLanguages,
          templateCode,
          testCases,
        });
        onUpdate(result);

        const stillActive = result.supportedLanguages.some(
          (l) => l.toUpperCase() === activeTemplateLang.toUpperCase(),
        );
        if (!stillActive && result.supportedLanguages.length > 0) {
          setActiveTemplateLang(result.supportedLanguages[0]);
        } else if (added.length > 0) {
          setActiveTemplateLang(added[added.length - 1].trim().toUpperCase());
        }
      } catch {
        toast.error('Không tải được template mặc định cho ngôn ngữ vừa thêm.');
        onUpdate({ supportedLanguages: nextLanguages.map((l) => l.trim().toUpperCase()), templateCode });
      } finally {
        setLoading(false);
      }
    },
    [
      supportedLanguages,
      templateCode,
      testCases,
      activeTemplateLang,
      setActiveTemplateLang,
      onUpdate,
    ],
  );

  return { handleLanguagesChange, loading };
}
