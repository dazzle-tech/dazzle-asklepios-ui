export type LinkMap = {
  next?: string | null;
  prev?: string | null;
  first?: string | null;
  last?: string | null;
};

export function parseLinkHeader(header: string | null): LinkMap {
  if (!header) return {};

  const links: LinkMap = {};
  const parts = header.split(",");

  parts.forEach((part) => {
    const section = part.split(";");
    if (section.length < 2) return;
    const url = section[0].trim().replace(/<(.*)>/, "$1");
    const rel = section[1].trim().replace(/rel="(.*)"/, "$1");
    links[rel as keyof LinkMap] = url;
  });

  return links;
}

export function extractPaginationFromLink(url: string) {
  try {
    const u = new URL(url);
    return {
      page: Number(u.searchParams.get("page")) || 0,
      size: Number(u.searchParams.get("size")) || 15,
    };
  } catch {
    return { page: 0, size: 15 };
  }
}
