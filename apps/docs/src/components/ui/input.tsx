import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

import { cn } from '@/lib/utils';

const inputVariants = cva(
  'w-full min-w-0 transition-[color,box-shadow] outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'h-9 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground md:text-sm dark:bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        bare: 'border-0 bg-transparent text-lg font-medium py-3.5 px-0 text-ink placeholder:text-ink-soft',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

type InputProps = React.ComponentProps<'input'> & VariantProps<typeof inputVariants>;

function Input({ className, type, variant, ...props }: InputProps) {
  return <input type={type} data-slot="input" className={cn(inputVariants({ variant, className }))} {...props} />;
}

export { Input, inputVariants };
