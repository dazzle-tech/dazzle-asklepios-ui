export type StimulsoftUiMode = 'light' | 'dark';

const DARK_PAGE_RGB = [32, 32, 36] as const;

const eachComponent = (component: any, visit: (item: any) => void) => {
  if (!component) return;
  visit(component);
  const comps = component.components;
  const count = comps?.count ?? comps?.list?.length ?? 0;
  for (let i = 0; i < count; i++) {
    const child = comps.getByIndex?.(i) ?? comps.list?.[i];
    eachComponent(child, visit);
  }
};

const toDrawingColor = (Stimulsoft: any, r: number, g: number, b: number) => {
  const Color = Stimulsoft?.System?.Drawing?.Color;
  if (!Color) return null;
  if (typeof Color.fromArgb === 'function') {
    return Color.fromArgb(255, r, g, b);
  }
  if (typeof Color.fromArgb2 === 'function') {
    return Color.fromArgb2(r, g, b);
  }
  return null;
};

export const applyStimulsoftAppearanceTheme = (
  Stimulsoft: any,
  options: any,
  uiMode?: StimulsoftUiMode
) => {
  const themes = Stimulsoft?.Viewer?.StiViewerTheme;
  const appearance = options?.appearance;
  if (!themes || !appearance) return;

  const isDark = uiMode === 'dark';
  const theme = isDark
    ? (themes.Office2022BlackBlue ?? themes.Office2022DarkGrayBlue)
    : (themes.Office2022WhiteBlue ?? themes.Office2022White);

  if (theme != null) appearance.theme = theme;

  if (!isDark) return;
  const background = toDrawingColor(Stimulsoft, 18, 18, 18);
  if (background && appearance.backgroundColor != null) {
    appearance.backgroundColor = background;
  }
};

export const applyStimulsoftDashboardColorMode = (
  Stimulsoft: any,
  report: any,
  uiMode?: StimulsoftUiMode
) => {
  if (uiMode !== 'dark' || !report?.pages) return;

  const styleIdent = Stimulsoft?.Report?.Dashboard?.StiElementStyleIdent;
  const darkStyle =
    styleIdent?.DarkGray ?? styleIdent?.DarkBlue ?? styleIdent?.WhiteBlack;
  const StiSolidBrush = Stimulsoft?.Base?.Drawing?.StiSolidBrush;
  const pageColor = toDrawingColor(
    Stimulsoft,
    DARK_PAGE_RGB[0],
    DARK_PAGE_RGB[1],
    DARK_PAGE_RGB[2]
  );

  const pageCount = report.pages.count ?? report.pages.list?.length ?? 0;
  for (let i = 0; i < pageCount; i++) {
    const page = report.pages.getByIndex?.(i) ?? report.pages.list?.[i];
    if (!page?.isDashboard) continue;

    if (darkStyle != null) {
      eachComponent(page, item => {
        if (item?.style != null) item.style = darkStyle;
      });
    }

    if (StiSolidBrush && pageColor) {
      try {
        page.brush = new StiSolidBrush(pageColor);
      } catch {
        /* brush type mismatch on this runtime */
      }
    }
  }
};
