'use client';

import * as React from 'react';
import { Button, Input } from '@haizo/ui';
import { FileUpload } from './FileUpload';

/**
 * An ordered gallery of image URLs: thumbnails with remove, plus add-by-upload or
 * add-by-URL. Uploads go through the same local-disk pipeline as avatars/covers.
 */
export function ImageListField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [url, setUrl] = React.useState('');

  const add = (raw: string) => {
    const u = raw.trim();
    if (u && !value.includes(u)) onChange([...value, u]);
  };
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-3">
          {value.map((src, i) => (
            <li key={`${src}-${i}`} className="relative">
              <img src={src} alt="" className="size-20 rounded-token border border-border object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="Remove image"
                className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full border border-border bg-card text-text-muted shadow hover:bg-bg-tint hover:text-danger"
              >
                <svg viewBox="0 0 20 20" fill="none" className="size-3.5">
                  <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex items-center gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add(url);
              setUrl('');
            }
          }}
          placeholder="https://… or upload →"
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            add(url);
            setUrl('');
          }}
          disabled={!url.trim()}
        >
          Add
        </Button>
        <FileUpload accept="image/*" label="Upload" onUploaded={(u) => add(u)} />
      </div>
    </div>
  );
}
