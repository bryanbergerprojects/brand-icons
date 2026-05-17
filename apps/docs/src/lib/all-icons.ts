import type { BrandIconProps } from '@brand-icons/core';
import {
  AppleLatestIcon,
  AtlassianLatestIcon,
  ClaudeLatestIcon,
  FacebookLatestIcon,
  GeminiLatestIcon,
  GitHubLatestIcon,
  GitLabLatestIcon,
  GoogleLatestIcon,
  LinkedInLatestIcon,
  MetaLatestIcon,
  MicrosoftLatestIcon,
  OpenAILatestIcon,
  VSCodeLatestIcon,
} from '@brand-icons/react';
import type { ComponentType } from 'react';

export type BrandIconComponent = ComponentType<BrandIconProps>;

export const latestIconBySlug: Readonly<Record<string, BrandIconComponent>> = {
  apple: AppleLatestIcon,
  atlassian: AtlassianLatestIcon,
  claude: ClaudeLatestIcon,
  facebook: FacebookLatestIcon,
  gemini: GeminiLatestIcon,
  github: GitHubLatestIcon,
  gitlab: GitLabLatestIcon,
  google: GoogleLatestIcon,
  linkedin: LinkedInLatestIcon,
  meta: MetaLatestIcon,
  microsoft: MicrosoftLatestIcon,
  openai: OpenAILatestIcon,
  vscode: VSCodeLatestIcon,
};
