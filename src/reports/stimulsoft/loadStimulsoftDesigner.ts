import config from '../../../app-config';

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

export const getStimulsoftAuthHeaders = (): { key: string; value: string }[] => {
  const raw =
    localStorage.getItem('id_token') || localStorage.getItem('token') || '';
  const jwt = raw.replace(/^Bearer\s+/i, '').trim();
  if (!jwt) return [];
  return [
    { key: 'Authorization', value: `Bearer ${jwt}` },
    { key: 'id_token', value: jwt },
  ];
};

const getAuthorizationHeader = () => getStimulsoftAuthHeaders()[0] ?? null;

/** Forward the HIS JWT on Stimulsoft adapter POSTs through /proxy. */
export const attachStimulsoftProxyHeaders = (report: any) => {
  const header = getAuthorizationHeader();
  if (!report || !header) return;

  const existing = report.httpHeadersContainer;
  if (existing && typeof existing.add === 'function') {
    existing.add(header);
    return;
  }
  if (Array.isArray(existing)) {
    report.httpHeadersContainer = [
      ...existing.filter(
        (item: { key?: string }) =>
          String(item?.key).toLowerCase() !== 'authorization'
      ),
      header,
    ];
    return;
  }
  report.httpHeadersContainer = [header];
};

/**
 * Loads Stimulsoft designer scripts only when called (Edit Report click).
 * The result is cached so later opens reuse the already-downloaded files.
 */
export const loadStimulsoftDesigner = (): Promise<any> => {
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
