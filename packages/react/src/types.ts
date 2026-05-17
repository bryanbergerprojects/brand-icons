import type { BrandIconProps } from '@brand-icons/core';
import type { ReactElement } from 'react';

export type {
  BrandIconProps,
  ColorMode,
  IconBrand,
  IconBrandYear,
  Variant,
} from '@brand-icons/core';

export type BrandIconComponent = (props: BrandIconProps) => ReactElement;
