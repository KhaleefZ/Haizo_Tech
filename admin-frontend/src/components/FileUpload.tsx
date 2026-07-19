'use client';

import * as React from 'react';
import { Button } from '@haizo/ui';
import { api, ApiError } from '../lib/api';

/**
 * Direct-to-storage upload. Asks the API for a presigned PUT, uploads the file
 * straight to the bucket (never through our server), then confirms and hands the
 * public URL back to the parent. Degrades gracefully when storage isn't wired.
 */
export function FileUpload({
  onUploaded,
  accept = 'image/*',
  label = 'Upload',
}: {
  onUploaded: (url: string) => void;
  accept?: string;
  label?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handle(file: File) {
    setBusy(true);
    setError(null);
    try {
      const { attachmentId, uploadUrl } = await api.uploads.presign({
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
      });
      // Straight to the bucket — no cookies, our API never sees the bytes.
      const put = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'content-type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!put.ok) throw new Error('upload failed');
      const { publicUrl } = await api.uploads.confirm(attachmentId);
      onUploaded(publicUrl);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 503
          ? 'File uploads aren’t configured yet — paste a URL instead.'
          : 'Upload failed. Try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handle(f);
          e.target.value = '';
        }}
      />
      <Button type="button" variant="outline" size="sm" loading={busy} onClick={() => inputRef.current?.click()}>
        {label}
      </Button>
      {error ? <p className="mt-1.5 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
