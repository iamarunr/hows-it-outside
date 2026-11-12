interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_SOURCE_URL?: string;
  readonly PUBLIC_AUTHOR_URL?: string;
  readonly PUBLIC_NOINDEX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
