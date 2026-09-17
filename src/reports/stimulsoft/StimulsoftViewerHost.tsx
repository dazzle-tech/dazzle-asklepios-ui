import React, { useEffect, useRef, useState } from 'react';

import { createPreparedStimulsoftReport } from './prepareStimulsoftReport';
import {
  prepareStimulsoftDataRequest,
  setActiveStimulsoftReport,
  tryFulfillStimulsoftApiRequest,
} from './stimulsoftApiProxy';
import {
  applyStimulsoftAppearanceTheme,
  applyStimulsoftDashboardColorMode,
  hideStimulsoftDashboardParameterControls,
  type StimulsoftUiMode,
} from './stimulsoftViewerTheme';
import './stimulsoftViewerHost.less';

type Props = {
  templateJson: string;
  params?: Record<string, string>;
  sessionKey: string | number;
  height?: string | number;
  uiMode?: StimulsoftUiMode;
  hideDashboardParameterControls?: boolean;
  onError?: (message: string) => void;
};

const applyViewerExportOptions = (Stimulsoft: any, options: any) => {
  if (options.appearance) {
    options.appearance.scrollbarsMode = true;
    options.appearance.fullScreenMode = false;
    options.appearance.showTooltips = true;
    if ('autoHideScrollbars' in options.appearance) {
      options.appearance.autoHideScrollbars = false;
    }
  }
  if (options.toolbar) {
    options.toolbar.visible = true;
    options.toolbar.showOpenButton = false;
    options.toolbar.showAboutButton = false;
    options.toolbar.showDesignButton = false;
    options.toolbar.showPrintButton = true;
    options.toolbar.showSaveButton = true;
    options.toolbar.showBookmarksButton = true;
    options.toolbar.showParametersButton = false;
    options.toolbar.zoom = 100;
    const viewMode = Stimulsoft?.Viewer?.StiWebViewMode;
    if (viewMode && options.toolbar.viewMode != null) {
      options.toolbar.viewMode =
        viewMode.Continuous ?? viewMode.SinglePage ?? options.toolbar.viewMode;
    }
  }
  if (!options.exports) return;
  const flags: Array<[string, boolean]> = [
    ['showExportToDocument', true],
    ['showExportToPdf', true],
    ['showExportToHtml', true],
    ['showExportToHtml5', true],
    ['showExportToWord2007', true],
    ['showExportToExcel2007', true],
    ['showExportToCsv', true],
    ['showExportToText', true],
    ['showExportToRtf', true],
    ['showExportToPowerPoint', true],
    ['showExportToOpenDocumentWriter', true],
    ['showExportToOpenDocumentCalc', true],
    ['showExportToImagePng', true],
    ['showExportToImageJpeg', true],
    ['showExportToJson', true],
  ];
  flags.forEach(([name, value]) => {
    if (name in options.exports) {
      options.exports[name] = value;
    }
  });
};

const StimulsoftViewerHost = ({
  templateJson,
  params = {},
  sessionKey,
  height = 'calc(100vh - 260px)',
  uiMode = 'light',
  hideDashboardParameterControls = false,
  onError,
}: Props) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const [status, setStatus] = useState('Loading report…');
  const paramsSignature = JSON.stringify(params);
  const boxStyle = {
    width: '100%' as const,
    height,
    minHeight: 280,
    position: 'relative' as const,
    overflow: 'auto' as const,
  };

  useEffect(() => {
    const container = hostRef.current;
    if (!container) return;

    let cancelled = false;
    let viewer: any = null;

    const show = async () => {
      setStatus('Loading report…');
      try {
        const { Stimulsoft, report } = await createPreparedStimulsoftReport(
          templateJson,
          params,
          { withViewer: true }
        );
        if (cancelled) return;
        if (!Stimulsoft?.Viewer?.StiViewer) {
          throw new Error(
            'Stimulsoft viewer is missing. Ensure stimulsoft.viewer.pack.js is loaded.'
          );
        }

        const options = new Stimulsoft.Viewer.StiViewerOptions();
        applyViewerExportOptions(Stimulsoft, options);
        applyStimulsoftAppearanceTheme(Stimulsoft, options, uiMode);
        applyStimulsoftDashboardColorMode(Stimulsoft, report, uiMode);
        if (hideDashboardParameterControls) {
          hideStimulsoftDashboardParameterControls(Stimulsoft, report);
        }

        viewer = new Stimulsoft.Viewer.StiViewer(
          options,
          `StiViewer_${sessionKey}`,
          false
        );

        if (typeof viewer.onBeginProcessData !== 'undefined') {
          viewer.onBeginProcessData = (args: any, callback?: any) => {
            const target = args?.report || report;
            prepareStimulsoftDataRequest(target, args);
            if (tryFulfillStimulsoftApiRequest(args, callback)) return;
          };
        }

        container.innerHTML = '';
        viewer.report = report;
        viewer.renderHtml(container);
        if (!cancelled) setStatus('');
      } catch (error: any) {
        if (cancelled) return;
        const message =
          error?.message || error?.data?.message || 'Error while opening report.';
        setStatus(message);
        onErrorRef.current?.(message);
      }
    };

    show();

    return () => {
      cancelled = true;
      setActiveStimulsoftReport(null);
      try {
        if (viewer) viewer.report = null;
      } catch {
        /* already disposed */
      }
      if (hostRef.current) {
        hostRef.current.innerHTML = '';
      }
    };
    // paramsSignature remounts the viewer when department/facility filters change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey, templateJson, uiMode, paramsSignature, hideDashboardParameterControls]);

  return (
    <div style={boxStyle}>
      {status ? (
        <div style={{ padding: 16, color: 'var(--rs-text-secondary)' }}>{status}</div>
      ) : null}
      <div
        ref={hostRef}
        className={`stimulsoft-viewer-host stimulsoft-viewer-host--${
          uiMode === 'dark' ? 'dark' : 'light'
        }${
          hideDashboardParameterControls
            ? ' stimulsoft-viewer-host--hide-params'
            : ''
        }`}
        style={{ width: '100%', height: '100%', minHeight: 280 }}
      />
    </div>
  );
};

export default StimulsoftViewerHost;
