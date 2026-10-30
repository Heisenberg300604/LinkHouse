'use client';
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

export function CopyLinkButton({
  path,
  label = 'Copy page link',
}: {
  path: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={label}
      title={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.origin + path);
          setCopied(true);
          toast.success('Link copied');
          setTimeout(() => setCopied(false), 1600);
        } catch {
          toast.error('Could not copy. Select the address and copy it manually.');
        }
      }}
    >
      {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
    </button>
  );
}
