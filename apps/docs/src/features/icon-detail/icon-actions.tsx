import { CheckIcon, CopyIcon, DownloadIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type CodeSnippet = {
  id: string;
  label: string;
  html: string;
  raw: string;
};

export type SvgDownload = {
  label: string;
  filename: string;
  raw: string;
};

export type IconActionsProps = {
  snippets: readonly CodeSnippet[];
  downloads: readonly SvgDownload[];
};

const downloadSvg = ({ filename, raw }: { filename: string; raw: string }): void => {
  const blob = new Blob([raw], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const IconActions = ({ snippets, downloads }: IconActionsProps) => {
  const [activeTab, setActiveTab] = useState(snippets[0]?.id ?? '');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (copiedId === null) return;
    const handle = window.setTimeout(() => setCopiedId(null), 2000);
    return () => window.clearTimeout(handle);
  }, [copiedId]);

  const handleCopy = async (snippet: CodeSnippet): Promise<void> => {
    try {
      await navigator.clipboard.writeText(snippet.raw);
      setCopiedId(snippet.id);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-3">
        {downloads.map((download) => (
          <Button
            key={download.filename}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => downloadSvg(download)}
            className="rounded-none border-ink/15 bg-paper font-mono text-xs uppercase tracking-widest shadow-none hover:border-accent hover:text-accent"
          >
            <DownloadIcon />
            Download {download.label}
          </Button>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
        <TabsList variant="line" className="h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
          {snippets.map((snippet) => (
            <TabsTrigger
              key={snippet.id}
              value={snippet.id}
              className="rounded-none border-b border-transparent px-3 py-2 font-mono text-xs uppercase tracking-widest text-ink-muted data-[state=active]:border-accent data-[state=active]:text-accent"
            >
              {snippet.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {snippets.map((snippet) => {
          const copied = copiedId === snippet.id;
          return (
            <TabsContent key={snippet.id} value={snippet.id} className="relative">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void handleCopy(snippet);
                }}
                className="absolute right-2 top-2 z-10 h-7 rounded-none border-ink/15 bg-paper px-2 font-mono text-xs uppercase tracking-widest shadow-none hover:border-accent hover:text-accent"
                aria-label={copied ? 'Copied' : `Copy ${snippet.label} snippet`}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <div
                className="overflow-x-auto border border-ink/10 bg-surface p-4 font-mono text-xs leading-relaxed [&_pre]:!bg-transparent [&_pre]:m-0 [&_pre]:p-0"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki-generated HTML built at build time from owned snippets
                dangerouslySetInnerHTML={{ __html: snippet.html }}
              />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default IconActions;
