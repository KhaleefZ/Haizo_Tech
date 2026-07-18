'use client';

import * as React from 'react';
import { cn } from './lib/cn';

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
  baseId: string;
  orientation: 'horizontal' | 'vertical';
  register: (value: string, node: HTMLButtonElement | null) => void;
  order: React.RefObject<string[]>;
  nodes: React.RefObject<Map<string, HTMLButtonElement>>;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs(component: string): TabsContextValue {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error(`<${component}> must be rendered inside <Tabs>.`);
  return ctx;
}

const tabId = (base: string, value: string) => `${base}-tab-${value}`;
const panelId = (base: string, value: string) => `${base}-panel-${value}`;

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Controlled value. */
  value?: string;
  defaultValue: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { className, value, defaultValue, onValueChange, orientation = 'horizontal', ...props },
  ref,
) {
  const baseId = React.useId();
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
  const current = value ?? uncontrolled;

  const order = React.useRef<string[]>([]);
  const nodes = React.useRef<Map<string, HTMLButtonElement>>(new Map());

  const setValue = React.useCallback(
    (next: string) => {
      if (value === undefined) setUncontrolled(next);
      onValueChange?.(next);
    },
    [value, onValueChange],
  );

  const register = React.useCallback((tabValue: string, node: HTMLButtonElement | null) => {
    if (node) {
      nodes.current.set(tabValue, node);
      if (!order.current.includes(tabValue)) order.current.push(tabValue);
    } else {
      nodes.current.delete(tabValue);
      order.current = order.current.filter((v) => v !== tabValue);
    }
  }, []);

  const ctx = React.useMemo<TabsContextValue>(
    () => ({ value: current, setValue, baseId, orientation, register, order, nodes }),
    [current, setValue, baseId, orientation, register],
  );

  return (
    <TabsContext.Provider value={ctx}>
      <div ref={ref} className={className} {...props} />
    </TabsContext.Provider>
  );
});

export type TabListProps = React.HTMLAttributes<HTMLDivElement>;

export const TabList = React.forwardRef<HTMLDivElement, TabListProps>(function TabList(
  { className, ...props },
  ref,
) {
  const { orientation } = useTabs('TabList');
  return (
    <div
      ref={ref}
      role="tablist"
      aria-orientation={orientation}
      className={cn(
        'flex gap-0.5 overflow-x-auto border-b border-border',
        orientation === 'vertical' && 'flex-col border-b-0 border-r',
        className,
      )}
      {...props}
    />
  );
});

export interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

/**
 * Roving tabindex: only the selected tab is in the tab order; arrows move
 * between tabs and select as they go, Home/End jump to the ends.
 */
export const Tab = React.forwardRef<HTMLButtonElement, TabProps>(function Tab(
  { className, value, onKeyDown, onClick, disabled, ...props },
  forwardedRef,
) {
  const { value: selected, setValue, baseId, orientation, register, order, nodes } =
    useTabs('Tab');
  const selectedState = selected === value;

  const setRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      register(value, node);
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [register, value, forwardedRef],
  );

  const move = (delta: number | 'first' | 'last') => {
    // Sort by DOM position — registration order can differ from visual order.
    const values = order.current
      .filter((v) => {
        const node = nodes.current.get(v);
        return node && !node.disabled;
      })
      .sort((a, b) => {
        const nodeA = nodes.current.get(a);
        const nodeB = nodes.current.get(b);
        if (!nodeA || !nodeB) return 0;
        return nodeA.compareDocumentPosition(nodeB) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });
    if (values.length === 0) return;
    const index = values.indexOf(value);
    let nextIndex: number;
    if (delta === 'first') nextIndex = 0;
    else if (delta === 'last') nextIndex = values.length - 1;
    else nextIndex = (index + delta + values.length) % values.length;

    const nextValue = values[nextIndex];
    if (nextValue === undefined) return;
    setValue(nextValue);
    nodes.current.get(nextValue)?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    const next = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
    const prev = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';

    switch (event.key) {
      case next:
        move(1);
        break;
      case prev:
        move(-1);
        break;
      case 'Home':
        move('first');
        break;
      case 'End':
        move('last');
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  return (
    <button
      ref={setRef}
      type="button"
      role="tab"
      id={tabId(baseId, value)}
      aria-selected={selectedState}
      aria-controls={panelId(baseId, value)}
      tabIndex={selectedState ? 0 : -1}
      disabled={disabled}
      onKeyDown={handleKeyDown}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setValue(value);
      }}
      className={cn(
        'cursor-pointer whitespace-nowrap border-b-2 border-transparent bg-transparent px-4 py-2.5',
        'text-sm font-semibold text-text-muted',
        'transition-[color,border-color] duration-150 ease-[var(--ease-out-soft)]',
        'hover:text-text-strong',
        'disabled:pointer-events-none disabled:opacity-45',
        selectedState && 'border-brand-blue text-brand-blue',
        className,
      )}
      {...props}
    />
  );
});

export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  /** Keep the panel mounted while hidden (preserves scroll/form state). */
  keepMounted?: boolean;
}

export const TabPanel = React.forwardRef<HTMLDivElement, TabPanelProps>(function TabPanel(
  { className, value, keepMounted = false, ...props },
  ref,
) {
  const { value: selected, baseId } = useTabs('TabPanel');
  const active = selected === value;

  if (!active && !keepMounted) return null;

  return (
    <div
      ref={ref}
      role="tabpanel"
      id={panelId(baseId, value)}
      aria-labelledby={tabId(baseId, value)}
      hidden={!active}
      tabIndex={0}
      className={cn('mt-5', className)}
      {...props}
    />
  );
});
