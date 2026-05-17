/**
 * Closed set of brand categories. Adding a new category is breaking and
 * requires ≥3 candidate icons — see `.claude/rules/meta.md §1.3`.
 */
export enum Category {
  AI = 'ai',
  DevTools = 'dev-tools',
  Platforms = 'platforms',
  Productivity = 'productivity',
  Social = 'social',
  Communication = 'communication',
  Design = 'design',
  Payments = 'payments',
  Analytics = 'analytics',
  ECommerce = 'e-commerce',
  SearchWeb = 'search-web',
  StorageCloud = 'storage-cloud',
  Media = 'media',
  Gaming = 'gaming',
  Finance = 'finance',
  Other = 'other',
}
