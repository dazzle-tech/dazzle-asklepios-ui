import { extractPaginationFromLink } from "./paginationHelper";

export class PaginationPerPage {
  static handlePageChange(
    _: unknown,
    newPage: number,
    paginationParams: { page: number; size: number; timestamp?: number },
    links: { next?: string | null; prev?: string | null; first?: string | null; last?: string | null },
 
    setPaginationParams: (params: any) => void
  ) {
    let targetLink: string | null | undefined = null;

    if (newPage > paginationParams.page && links.next) targetLink = links.next;
    else if (newPage < paginationParams.page && links.prev) targetLink = links.prev;
    else if (newPage === 0 && links.first) targetLink = links.first;
    else if (newPage > paginationParams.page + 1 && links.last)
      targetLink = links.last;

    if (targetLink) {
      const { page, size } = extractPaginationFromLink(targetLink);
      setPaginationParams({
        ...paginationParams,
        page,
        size,
        timestamp: Date.now(),
      });
    }
  }
}
