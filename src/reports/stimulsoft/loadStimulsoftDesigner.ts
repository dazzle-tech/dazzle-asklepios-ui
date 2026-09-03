import config from '../../../app-config';
import { installStimulsoftApiInterceptor } from './stimulsoftApiProxy';
import { getStimulsoftAuthHeaders } from './stimulsoftAuth';

export { getStimulsoftAuthHeaders } from './stimulsoftAuth';

const SCRIPT_FILES = [
  '/stimulsoft/stimulsoft.reports.pack.js',
  '/stimulsoft/stimulsoft.viewer.pack.js',
  '/stimulsoft/stimulsoft.designer.pack.js',
];

let loadPromise: Promise<any> | null = null;

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if ((existing as HTMLScriptElement).dataset.loaded === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error(`Failed to load ${src}`)),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () =>
      reject(
        new Error(
          `Failed to load ${src}. Run npm install so webpack can copy Stimulsoft pack scripts into public/stimulsoft.`
        )
      );
    document.body.appendChild(script);
  });

const applyLicense = (Stimulsoft: any) => {
  const key = config.stimulsoftLicenseKey;
  if (!key || !Stimulsoft?.Base?.StiLicense) return;
  Stimulsoft.Base.StiLicense.Key = key;
};

/**
 * Point SQL / remote-data adapter calls at a same-origin /proxy.
 * Webpack-dev-server (or Spring Boot / nginx in production) must host that path.
 */
export const applyStimulsoftWebServer = (Stimulsoft: any) => {
  const webServer = Stimulsoft?.StiOptions?.WebServer;
  if (!webServer) return;
  webServer.url = config.stimulsoftProxyUrl || '';
  if (typeof config.stimulsoftEncryptData === 'boolean') {
    webServer.encryptData = config.stimulsoftEncryptData;
  }
  if (Stimulsoft.StiOptions?.Dictionary) {
    Stimulsoft.StiOptions.Dictionary.allowRestConnections = true;
  }
};

/** Forward the HIS JWT on Stimulsoft adapter POSTs through /proxy. */
export const attachStimulsoftProxyHeaders = (report: any) => {
  const headers = getStimulsoftAuthHeaders();
  if (!report || headers.length === 0) return;

  const existing = report.httpHeadersContainer;
  if (existing && typeof existing.add === 'function') {
    headers.forEach(header => existing.add(header));
    return;
  }
  const withoutAuth = Array.isArray(existing)
    ? existing.filter(
        (item: { key?: string }) =>
          !['authorization', 'id_token'].includes(String(item?.key).toLowerCase())
      )
    : [];
  report.httpHeadersContainer = [...withoutAuth, ...headers];
};

/**
 * Loads Stimulsoft designer scripts only when called (Edit Report click).
 * The result is cached so later opens reuse the already-downloaded files.
 */
export const loadStimulsoftDesigner = (): Promise<any> => {
  // Patch fetch/XHR before Stimulsoft scripts capture the native functions.
  installStimulsoftApiInterceptor();

  if (window.Stimulsoft?.Designer?.StiDesigner) {
    applyLicense(window.Stimulsoft);
    applyStimulsoftWebServer(window.Stimulsoft);
    return Promise.resolve(window.Stimulsoft);
  }

  if (!loadPromise) {
    loadPromise = SCRIPT_FILES.reduce(
      (chain, src) => chain.then(() => loadScript(src)),
      Promise.resolve()
    )
      .then(() => {
        const Stimulsoft = window.Stimulsoft;
        if (!Stimulsoft?.Report?.StiReport) {
          throw new Error('Stimulsoft engine did not initialize.');
        }
        if (!Stimulsoft?.Designer?.StiDesigner) {
          throw new Error(
            'Stimulsoft designer is missing. Ensure stimulsoft.designer.pack.js is in public/stimulsoft.'
          );
        }
        applyLicense(Stimulsoft);
        applyStimulsoftWebServer(Stimulsoft);
        return Stimulsoft;
      })
      .catch(error => {
        loadPromise = null;
        throw error;
      });
  }

  return loadPromise;
};
