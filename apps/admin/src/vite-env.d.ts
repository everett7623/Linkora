/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LINKETRY_BASE_PATH?: string;
  readonly VITE_LINKETRY_DEMO_MODE?: string;
  readonly VITE_LINKETRY_DEMO_ACCESS_CODE?: string;
  readonly VITE_LINKETRY_REPOSITORY_URL?: string;
  readonly VITE_LINKETRY_UPDATE_BRANCH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
