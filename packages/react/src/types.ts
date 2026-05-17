import type { ReactElement } from 'react';
import type { BrandIconProps } from '@brand-icons/core';

export type {
  BrandIconProps,
  ColorMode,
  Variant,
  IconBrand,
  IconBrandYear,
} from '@brand-icons/core';

export type BrandIconComponent = (props: BrandIconProps) => ReactElement;
