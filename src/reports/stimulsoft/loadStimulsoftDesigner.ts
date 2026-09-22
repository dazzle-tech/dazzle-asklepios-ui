import config from '../../../app-config';
import { installStimulsoftApiInterceptor, patchStimulsoftHttp } from './stimulsoftApiProxy';

export { getStimulsoftAuthHeaders } from './stimulsoftAuth';

const ENGINE_FILES = [
  '/stimulsoft/stimulsoft.reports.pack.js',
  '/stimulsoft/stimulsoft.dashboards.pack.js',
  '/stimulsoft/stimulsoft.viewer.pack.js',
];

const SCRIPT_FILES = [
  ...ENGINE_FILES,
  '/stimulsoft/stimulsoft.designer.pack.js',
];

let loadPromise: Promise<any> | null = null;
let enginePromise: Promise<any> | null = null;
let hostPrototypeGuardInstalled = false;

const stimulsoftHostPrototypes = () =>
  typeof window === 'undefined'
    ? []
    : [
        Object.prototype,
        Array.prototype,
        Date.prototype,
        String.prototype,
        Number.prototype,
        Boolean.prototype,
      ];

const isStimulsoftHostSymbol = (key: PropertyKey) =>
  typeof key === 'symbol' && String(key).toLowerCase().includes('stimulsoft');

/**
 * Stimulsoft attaches an enumerable Symbol(stimulsoft) to built-in prototypes.
 * lodash omitBy/pickBy then hands that symbol to rsuite DatePicker as a key,
 * which crashes with `key.startsWith is not a function`.
 */
const hideStimulsoftHostSymbols = () => {
  stimulsoftHostPrototypes().forEach(proto => {
    Object.getOwnPropertySymbols(proto).forEach(symbol => {
      if (!isStimulsoftHostSymbol(symbol)) return;
      const descriptor = Object.getOwnPropertyDescriptor(proto, symbol);
      if (!descriptor?.enumerable) return;
      try {
        Object.defineProperty(proto, symbol, {
          ...descriptor,
          enumerable: false,
        });
      } catch {
        /* already sealed */
      }
    });
  });
};

const installStimulsoftHostPrototypeGuard = () => {
  if (hostPrototypeGuardInstalled || typeof window === 'undefined') return;
  hostPrototypeGuardInstalled = true;

  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = ((
    obj: any,
    key: PropertyKey,
    descriptor: PropertyDescriptor
  ) => {
    if (
      descriptor &&
      isStimulsoftHostSymbol(key) &&
      stimulsoftHostPrototypes().includes(obj)
    ) {
      descriptor = { ...descriptor, enumerable: false };
    }
    return originalDefineProperty.call(Object, obj, key, descriptor);
  }) as typeof Object.defineProperty;

  hideStimulsoftHostSymbols();
};

const finishEngine = (Stimulsoft: any) => {
  if (!Stimulsoft?.Report?.StiReport) {
    throw new Error('Stimulsoft engine did not initialize.');
  }
  hideStimulsoftHostSymbols();
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
        hideStimulsoftHostSymbols();
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
      hideStimulsoftHostSymbols();
      resolve();
    };
    script.onerror = () =>
      reject(
        new Error(
          `Failed to load ${src}. Run npm install so webpack can copy Stimulsoft pack scripts (including dashboards) into public/stimulsoft.`
        )
      );
    document.body.appendChild(script);
  });

const productList = (licenseKey: any): any[] => {
  const products = licenseKey?.products;
  if (!products) return [];
  if (Array.isArray(products)) return products;
  if (Array.isArray(products.list)) return products.list;
  const count = Number(products.count ?? 0);
  if (typeof products.getByIndex === 'function' && count > 0) {
    const items: any[] = [];
    for (let i = 0; i < count; i += 1) items.push(products.getByIndex(i));
    return items;
  }
  return [];
};

const mergeLicenseProducts = (target: any, source: any) => {
  if (!target || !source) return;
  const have = new Set(
    productList(target).map((item: any) => item?.ident ?? item?.Ident)
  );
  productList(source).forEach((product: any) => {
    const ident = product?.ident ?? product?.Ident;
    if (ident == null || have.has(ident)) return;
    have.add(ident);
    const products = target.products;
    if (typeof products?.add === 'function') products.add(product);
    else if (Array.isArray(products)) products.push(product);
    else if (Array.isArray(products?.list)) products.list.push(product);
  });
};

const assignLicenseString = (license: any, value: string) => {
  if (!license || !value) return;
  try {
    if (typeof license.setNewLicenseKey === 'function') {
      license.setNewLicenseKey(value, false);
    }
  } catch {
    /* try the public setters next */
  }
  try {
    license.key = value;
  } catch {
    /* Dashboards.JS samples use lowercase key */
  }
  try {
    license.Key = value;
  } catch {
    /* Reports.JS / C# style */
  }
};

export const applyLicense = (Stimulsoft: any) => {
  const license = Stimulsoft?.Base?.StiLicense;
  if (!license) return;

  const reportKey = String(
    window.APP_CONFIG?.stimulsoftLicenseKey || config.stimulsoftLicenseKey || ''
  ).trim();
  const dashboardKey = String(
    window.APP_CONFIG?.stimulsoftDashboardLicenseKey ||
      config.stimulsoftDashboardLicenseKey ||
      ''
  ).trim();

  const LicenseKey = Stimulsoft.Base?.Licenses?.StiLicenseKey;
  const decode = (raw: string) => {
    if (!raw || typeof LicenseKey?.get2 !== 'function') return null;
    try {
      return LicenseKey.get2(raw);
    } catch {
      return null;
    }
  };

  const reportLic = decode(reportKey);
  const dashboardLic = decode(dashboardKey);
  const dashboardsLicensed = () =>
    Stimulsoft.Base?.Licenses?.StiLicenseKeyValidator?.isValidOnDbsJS?.() === true;

  // Two complete keys cannot be concatenated (that JSON-parses as one license).
  // Decode both and merge product idents so Reports.JS + Dashboards.JS are valid.
  if (reportLic && dashboardLic) {
    mergeLicenseProducts(reportLic, dashboardLic);
    assignLicenseString(license, reportKey);
    license.licenseKey = reportLic;
    if (!dashboardsLicensed() && dashboardKey) {
      mergeLicenseProducts(dashboardLic, reportLic);
      assignLicenseString(license, dashboardKey);
      license.licenseKey = dashboardLic;
    }
    return;
  }

  // Dashboards.JS trial watermark is tied to the DbsJs product. Prefer that key
  // when only one of the two can be applied.
  if (dashboardKey) {
    assignLicenseString(license, dashboardKey);
    if (dashboardLic) license.licenseKey = dashboardLic;
    return;
  }
  if (reportKey) assignLicenseString(license, reportKey);
};

/**
 * Point SQL adapter calls at a same-origin /proxy (Node or Java data adapter).
 * REST JSON sources keep using /api and are handled by stimulsoftApiProxy.
 */
export const applyStimulsoftWebServer = (Stimulsoft: any) => {
  const webServer = Stimulsoft?.StiOptions?.WebServer;
  if (!webServer) return;
  webServer.url = config.stimulsoftProxyUrl || '/proxy';
  if (typeof config.stimulsoftEncryptData === 'boolean') {
    webServer.encryptData = config.stimulsoftEncryptData;
  }
  if (Stimulsoft.StiOptions?.Dictionary) {
    Stimulsoft.StiOptions.Dictionary.allowRestConnections = true;
  }
};

/**
 * Do not put the HIS JWT on SQL adapter POSTs. Adding it on every designer
 * event duplicated Authorization/id_token until Node returned HTTP 431.
 * REST /api calls still get the JWT from the XHR interceptor.
 */
export const attachStimulsoftProxyHeaders = (report: any) => {
  if (!report) return;
  const isAuth = (key?: string) =>
    ['authorization', 'id_token'].includes(String(key || '').toLowerCase());
  const dropAuth = (items: { key?: string }[]) =>
    items.filter(item => !isAuth(item?.key));

  const existing = report.httpHeadersContainer;
  if (!existing) return;

  if (Array.isArray(existing)) {
    report.httpHeadersContainer = dropAuth(existing);
    return;
  }
  const list = existing.list ?? existing.items;
  if (Array.isArray(list)) {
    const kept = dropAuth(list);
    list.length = 0;
    kept.forEach((item: { key?: string }) => list.push(item));
  }
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
    stack.includes('getElementAttributesAsync') ||
    stack.includes('StiReportHelper') ||
    message.includes("reading 'bottom'") ||
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
  installStimulsoftHostPrototypeGuard();

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
  installStimulsoftHostPrototypeGuard();

  if (window.Stimulsoft?.Designer?.StiDesigner) {
    hideStimulsoftHostSymbols();
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
        hideStimulsoftHostSymbols();
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
