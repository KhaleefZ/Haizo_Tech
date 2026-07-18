'use client';

import * as React from 'react';
import { cn } from './cn';

type AnyProps = Record<string, unknown>;

export function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

/**
 * Minimal Radix-style `Slot`: renders its single child, merging the parent's
 * props into it. Child props win on conflicts, except handlers (both run),
 * className (merged via `cn`) and style (child overrides key-by-key).
 */
export const Slot = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  function Slot({ children, ...slotProps }, forwardedRef) {
    if (!React.isValidElement(children)) return null;

    const child = children as React.ReactElement<AnyProps> & { ref?: React.Ref<HTMLElement> };
    const childProps = child.props;
    const merged: AnyProps = { ...slotProps, ...childProps };

    for (const key of Object.keys(slotProps)) {
      if (!/^on[A-Z]/.test(key)) continue;
      const slotHandler = (slotProps as AnyProps)[key];
      const childHandler = childProps[key];
      if (typeof slotHandler === 'function' && typeof childHandler === 'function') {
        merged[key] = (...args: unknown[]) => {
          (childHandler as (...a: unknown[]) => void)(...args);
          (slotHandler as (...a: unknown[]) => void)(...args);
        };
      }
    }

    merged['className'] = cn(slotProps.className, childProps['className'] as string | undefined);
    merged['style'] = {
      ...(slotProps.style ?? {}),
      ...((childProps['style'] as React.CSSProperties | undefined) ?? {}),
    };
    merged['ref'] = mergeRefs(forwardedRef, child.ref);

    return React.cloneElement(child, merged);
  },
);
