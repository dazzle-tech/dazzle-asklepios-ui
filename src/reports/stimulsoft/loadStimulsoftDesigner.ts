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
 * Loads Stimulsoft designer scripts only when called (Edit Report click).
 * The result is cached so later opens reuse the already-downloaded files.
 */
export const loadStimulsoftDesigner = (): Promise<any> => {
  if (window.Stimulsoft?.Designer?.StiDesigner) {
    applyLicense(window.Stimulsoft);
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
        return Stimulsoft;
      })
      .catch(error => {
        loadPromise = null;
        throw error;
      });
  }

  return loadPromise;
};
