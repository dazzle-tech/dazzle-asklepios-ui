/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly BACKEND_BASE_URL?: string;
    readonly TENANT_ID?: string;
    readonly TENANT_SECURITY_TOKEN?: string;
    readonly GENERATE_SOURCEMAP?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
