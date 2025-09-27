declare module 'vaul' {
  import * as React from 'react';

  export interface DrawerProps {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    modal?: boolean;
    dismissible?: boolean;
    shouldScaleBackground?: boolean;
    snapPoints?: number[];
    activeSnapPoint?: number | null;
    setActiveSnapPoint?: (snapPoint: number | null) => void;
    closeThreshold?: number;
    scrollLockTimeout?: number;
    fixed?: boolean;
    direction?: 'top' | 'bottom' | 'left' | 'right';
    nested?: boolean;
    onDrag?: (
      event: React.PointerEvent<HTMLDivElement>,
      percentageDragged: number
    ) => void;
    onRelease?: (
      event: React.PointerEvent<HTMLDivElement>,
      open: boolean
    ) => void;
  }

  export const Drawer: React.FC<DrawerProps> & {
    Trigger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>;
    Portal: React.FC<{ children: React.ReactNode }>;
    Content: React.FC<React.HTMLAttributes<HTMLDivElement>>;
    Overlay: React.FC<React.HTMLAttributes<HTMLDivElement>>;
    Close: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>;
    Title: React.FC<React.HTMLAttributes<HTMLHeadingElement>>;
    Description: React.FC<React.HTMLAttributes<HTMLParagraphElement>>;
  };
}