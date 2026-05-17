export type {
  ColorMode,
  IconBrand,
  IconBrandYear,
  IconBrandYearRender,
  Variant,
} from './types';
export { BrandIcon, registerBrandIcon } from './runtime/brand-icon';

import { registerBrandIcon } from './runtime/brand-icon';

registerBrandIcon();
