import config from '../../../app-config';
import { installStimulsoftApiInterceptor, patchStimulsoftHttp } from './stimulsoftApiProxy';
import { getStimulsoftAuthHeaders } from './stimulsoftAuth';

export { getStimulsoftAuthHeaders } from './stimulsoftAuth';

const ENGINE_FILES = [
  '/stimulsoft/stimulsoft.reports.pack.js',
  '/stimulsoft/stimulsoft.viewer.pack.js',
];

const SCRIPT_FILES = [
  ...ENGINE_FILES,
  '/stimulsoft/stimulsoft.designer.pack.js',
];

let loadPromise: Promise<any> | null = null;
let enginePromise: Promise<any> | null = null;

const finishEngine = (Stimulsoft: any) => {
  if (!Stimulsoft?.Report?.StiReport) {
    throw new Error('Stimulsoft engine did not initialize.');
  }
  applyLicense(Stimulsoft);
  applyStimulsoftWebServer(Stimulsoft);
  installStimulsoftErrorGuards();
  patchStimulsoftHttp(Stimulsoft);
  patchStimulsoftDesignerRuntime(Stimulsoft);
  return Stimulsoft;
};

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

const isStimulsoftInternalError = (error: unknown) => {
  const message = String((error as any)?.message || error || '');
  const stack = String((error as any)?.stack || '');
  return (
    stack.includes('StiDictionaryHelper') ||
    stack.includes('synchronizeDictionary') ||
    stack.includes('StiMobileDesigner.ZoomPage') ||
    stack.includes('StiMobileDesigner.ConvertPixelToUnit') ||
    stack.includes('StiMobileDesigner.FindMousePosOnSvgPage') ||
    stack.includes('ZoomPage') ||
    stack.includes('ConvertPixelToUnit') ||
    stack.includes('FindMousePosOnSvgPage') ||
    message.includes("reading 'reportUnit'") ||
    message.includes("reading 'forEach'") ||
    message.includes("reading 'repaint'")
  );
};

const wrapSafeMethod = (obj: any, name: string) => {
  if (!obj || typeof obj[name] !== 'function' || obj[name].__stiSafe) return;
  const original = obj[name];
  const wrapped = function (this: any, ...args: any[]) {
    try {
      const result = original.apply(this, args);
      if (result && typeof result.then === 'function') {
        return Promise.resolve(result).catch(() => undefined);
      }
      return result;
    } catch {
      return undefined;
    }
  };
  wrapped.__stiSafe = true;
  obj[name] = wrapped;
};

const designerReport = (js: any) =>
  js?.options?.report ?? js?.options?.currentPage?.report ?? js?.report;

const wrapConvertPixelToUnit = (obj: any) => {
  if (!obj || typeof obj.ConvertPixelToUnit !== 'function' || obj.ConvertPixelToUnit.__stiSafe) {
    return;
  }
  const original = obj.ConvertPixelToUnit;
  const wrapped = function (this: any, value: any, ...rest: any[]) {
    const report = designerReport(this);
    if (!report || report.reportUnit == null) return value;
    try {
      return original.call(this, value, ...rest);
    } catch {
      return value;
    }
  };
  wrapped.__stiSafe = true;
  obj.ConvertPixelToUnit = wrapped;
};

const wrapFindMousePosOnSvgPage = (obj: any) => {
  if (
    !obj ||
    typeof obj.FindMousePosOnSvgPage !== 'function' ||
    obj.FindMousePosOnSvgPage.__stiSafe
  ) {
    return;
  }
  const original = obj.FindMousePosOnSvgPage;
  const wrapped = function (this: any, ...args: any[]) {
    const report = designerReport(this);
    if (!report || report.reportUnit == null || !this?.options?.currentPage) {
      return { x: 0, y: 0 };
    }
    try {
      return original.apply(this, args);
    } catch {
      return { x: 0, y: 0 };
    }
  };
  wrapped.__stiSafe = true;
  obj.FindMousePosOnSvgPage = wrapped;
};

const ensureCollectionList = (collection: any) => {
  if (!collection || Array.isArray(collection.list)) return;
  try {
    collection.list = [];
  } catch {
    // read-only collection
  }
};

const ensureReportDictionaryLists = (report: any) => {
  const dictionary = report?.dictionary;
  if (!dictionary) return;
  [
    'databases',
    'dataSources',
    'variables',
    'resources',
    'relations',
    'businessObjects',
    'userFunctions',
  ].forEach(name => ensureCollectionList(dictionary[name]));
};

/**
 * DictionaryHelper.synchronizeDictionaryAsync does `databases.list.forEach`.
 * If that throws, the designer never receives the tree (data sources, variables,
 * functions all stay empty). Keep the command working and still return a tree.
 */
export const patchStimulsoftDictionaryHelper = (Stimulsoft?: any) => {
  const Helper = (Stimulsoft ?? window.Stimulsoft)?.Designer?.StiDictionaryHelper;
  if (!Helper?.synchronizeDictionaryAsync || Helper.synchronizeDictionaryAsync.__stiPatched) {
    return;
  }
  const original = Helper.synchronizeDictionaryAsync.bind(Helper);
  const patched = async function (
    report: any,
    param: any,
    callbackResult: any
  ) {
    ensureReportDictionaryLists(report);
    try {
      return await original(report, param, callbackResult);
    } catch {
      if (callbackResult && typeof Helper.getDictionaryTree === 'function') {
        try {
          callbackResult.dictionary = Helper.getDictionaryTree(report);
        } catch {
          // designer keeps the previous tree
        }
      }
    }
  };
  patched.__stiPatched = true;
  Helper.synchronizeDictionaryAsync = patched;
};

/** Stimulsoft throws while the designer canvas is still booting. */
export const patchStimulsoftDesignerRuntime = (target?: any) => {
  const Stimulsoft = window.Stimulsoft;
  patchStimulsoftDictionaryHelper(Stimulsoft);
  const methodNames = ['ZoomPage'];
  const patchRoot = (root: any) => {
    if (!root) return;
    methodNames.forEach(name => {
      wrapSafeMethod(root, name);
      wrapSafeMethod(root.prototype, name);
    });
    wrapConvertPixelToUnit(root);
    wrapConvertPixelToUnit(root.prototype);
    wrapFindMousePosOnSvgPage(root);
    wrapFindMousePosOnSvgPage(root.prototype);
  };
  const roots = [
    target,
    target?.constructor?.prototype,
    Stimulsoft?.Designer,
    (window as any).StiMobileDesigner,
    (window as any).StiMobileDesigner?.prototype,
  ];
  roots.forEach(patchRoot);
};

let stimulsoftErrorGuardsInstalled = false;

const installStimulsoftErrorGuards = () => {
  if (stimulsoftErrorGuardsInstalled || typeof window === 'undefined') return;
  stimulsoftErrorGuardsInstalled = true;
  window.addEventListener(
    'error',
    event => {
      if (!isStimulsoftInternalError(event.error || event.message)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true
  );
  window.addEventListener(
    'unhandledrejection',
    event => {
      if (!isStimulsoftInternalError(event.reason)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
    },
    true
  );
};

const ensureViewer = async (Stimulsoft: any) => {
  if (Stimulsoft?.Viewer?.StiViewer) return Stimulsoft;
  await loadScript('/stimulsoft/stimulsoft.viewer.pack.js');
  if (!window.Stimulsoft?.Viewer?.StiViewer) {
    throw new Error(
      'Stimulsoft viewer is missing. Ensure stimulsoft.viewer.pack.js is in public/stimulsoft.'
    );
  }
  return finishEngine(window.Stimulsoft);
};

/**
 * Reports + viewer only — used for print. Designer pack is not required.
 */
export const loadStimulsoftEngine = (): Promise<any> => {
  installStimulsoftApiInterceptor();

  if (window.Stimulsoft?.Report?.StiReport) {
    return Promise.resolve(finishEngine(window.Stimulsoft));
  }

  if (loadPromise) {
    return loadPromise;
  }

  if (!enginePromise) {
    enginePromise = ENGINE_FILES.reduce(
      (chain, src) => chain.then(() => loadScript(src)),
      Promise.resolve()
    )
      .then(() => finishEngine(window.Stimulsoft))
      .catch(error => {
        enginePromise = null;
        throw error;
      });
  }

  return enginePromise;
};

/** Reports engine plus viewer pack (Save / export toolbar). */
export const loadStimulsoftViewer = async (): Promise<any> =>
  ensureViewer(await loadStimulsoftEngine());

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
    installStimulsoftErrorGuards();
    patchStimulsoftHttp(window.Stimulsoft);
    patchStimulsoftDesignerRuntime(window.Stimulsoft);
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
        installStimulsoftErrorGuards();
        patchStimulsoftHttp(Stimulsoft);
        patchStimulsoftDesignerRuntime(Stimulsoft);
        return Stimulsoft;
      })
      .catch(error => {
        loadPromise = null;
        throw error;
      });
  }

  return loadPromise;
};
