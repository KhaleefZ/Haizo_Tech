'use client';

import * as React from 'react';
import { Button } from '@haizo/ui';
import { api, ApiError } from '../lib/api';

/**
 * Uploads a file to the API (which stores it on the server's disk) and hands the
 * resulting public URL back to the parent.
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
      const { url } = await api.uploads.upload(file);
      onUploaded(url);
    } catch (err) {
      setError(
        err instanceof ApiError && (err.status === 413 || err.status === 400)
          ? 'That file is too large or an unsupported type.'
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
