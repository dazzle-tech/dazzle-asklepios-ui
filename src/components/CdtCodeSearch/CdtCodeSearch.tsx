import React, { useEffect, useRef, useState } from 'react';
import CloseIcon from '@rsuite/icons/Close';
import { Col, Dropdown, Input, InputGroup, Row, Text } from 'rsuite';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import {
  useLazyGetCdtByKeywordQuery,
  useLazyGetCdtByIdQuery,
} from '@/services/setup/cdtCodeService';
import './styles.less';

type CdtItem = {
  id: number;
  code: string;
  description?: string;
};

type PagedResult<T> = {
  data: T[];
  totalCount: number;
  links?: { next?: string | null };
};

type Props = {
  cdtCodeId?: number | null;
  setCdtCodeId: (id: number | null) => void;
  label?: string;
  disabled?: boolean;
  pageSize?: number;
};

const CdtCodeSearch: React.FC<Props> = ({
  cdtCodeId = null,
  setCdtCodeId,
  label = 'CDT Code',
  disabled = false,
  pageSize = 15,
}) => {
  const [keyword, setKeyword] = useState('');
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState<{ next?: string | null }>({});
  const [accum, setAccum] = useState<Record<string, CdtItem>>({});
  const [isAppending, setIsAppending] = useState(false);
  const [display, setDisplay] = useState({ code: '', desc: '' });

  const [searchCdt, { isFetching: isSearching }] = useLazyGetCdtByKeywordQuery();
  const [getById, { isFetching: isByIdLoading }] = useLazyGetCdtByIdQuery();

  const lastKeywordRef = useRef('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClear = () => {
    setCdtCodeId(null);
    setDisplay({ code: '', desc: '' });
    setKeyword('');
    setOpen(false);
    setLinks({});
    setAccum({});
    setIsAppending(false);
  };

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!open) return;
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open]);

  const loadFirstPage = async (kw: string) => {
    const trimmed = (kw || '').trim();
    lastKeywordRef.current = trimmed;
    setLinks({});
    setAccum({});
    setIsAppending(false);

    if (trimmed.length < 2) {
      setOpen(false);
      return;
    }

    try {
      const resp = await searchCdt({ keyword: trimmed, page: 0, size: pageSize, timestamp: Date.now() }).unwrap();
      const pr = resp as unknown as PagedResult<CdtItem>;
      const obj: Record<string, CdtItem> = {};
      (pr.data ?? []).forEach(item => { obj[String(item.id)] = item; });
      setAccum(obj);
      setLinks({ next: pr.links?.next ?? null });
      setOpen(true);
    } catch {
      setOpen(false);
    }
  };

  const handleLoadMore = async () => {
    const nextLink = links?.next;
    if (!nextLink) return;
    const { page: nextPage, size } = extractPaginationFromLink(nextLink);
    setIsAppending(true);
    try {
      const resp = await searchCdt({ keyword: lastKeywordRef.current, page: nextPage, size: size || pageSize, timestamp: Date.now() }).unwrap();
      const pr = resp as unknown as PagedResult<CdtItem>;
      setAccum(prev => {
        const updated = { ...prev };
        (pr.data ?? []).forEach(item => { updated[String(item.id)] = item; });
        return updated;
      });
      setLinks({ next: pr.links?.next ?? null });
    } finally {
      setIsAppending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); loadFirstPage(keyword); }
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  };

  useEffect(() => {
    if (!cdtCodeId) {
      setDisplay({ code: '', desc: '' });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const cdt = await getById({ id: cdtCodeId, timestamp: Date.now() }).unwrap();
        if (cancelled) return;
        setDisplay({ code: cdt?.code ?? '', desc: cdt?.description ?? '' });
      } catch {
        if (cancelled) return;
        setDisplay({ code: '', desc: '' });
      }
    })();
    return () => { cancelled = true; };
  }, [cdtCodeId]);

  const canLoadMore = Boolean(links?.next);

  return (
    <div className="cdt-search">
      <Row className="cdt-search__row">
        <Text className="cdt-search__label">{label}</Text>
        <Col md={24}>
          <div className="cdt-search__field" ref={dropdownRef}>
            <InputGroup inside className="cdt-search__inputGroup">
              <Input
                placeholder="Search CDT (min 2 chars) - Press Enter"
                value={keyword}
                onChange={v => { setKeyword(v); if (!v) setOpen(false); }}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                onFocus={() => { if (Object.keys(accum).length > 0) setOpen(true); }}
                className="cdt-search__input"
              />
              <InputGroup.Button
                className="cdt-search__btn cdt-search__btn--icon"
                onClick={() => setOpen(false)}
                disabled={!open}
                title="Close list"
              >
                <CloseIcon />
              </InputGroup.Button>
              <InputGroup.Button
                className="cdt-search__btn cdt-search__btn--clear"
                onClick={handleClear}
                disabled={disabled || (!cdtCodeId && !display.code && !keyword)}
                title="Clear"
              >
                Clear
              </InputGroup.Button>
            </InputGroup>

            {open && keyword.trim().length >= 2 && (
              <div className="cdt-search__dropdown">
                <Dropdown.Menu className="cdt-search__menu">
                  {isSearching && Object.keys(accum).length === 0 && (
                    <Dropdown.Item disabled>Loading...</Dropdown.Item>
                  )}
                  {!isSearching && Object.keys(accum).length === 0 && (
                    <Dropdown.Item disabled>No results</Dropdown.Item>
                  )}
                  {Object.entries(accum).map(([key, item]) => (
                    <Dropdown.Item
                      key={key}
                      className="cdt-search__item"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => {
                        setCdtCodeId(item.id);
                        setDisplay({ code: item.code, desc: item.description ?? '' });
                        setKeyword('');
                        setOpen(false);
                      }}
                    >
                      <span className="cdt-search__code">{item.code}</span>
                      <span className="cdt-search__desc">{item.description ?? ''}</span>
                    </Dropdown.Item>
                  ))}
                  {canLoadMore && (
                    <Dropdown.Item
                      className="cdt-search__loadMore"
                      onMouseDown={e => e.preventDefault()}
                      onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isAppending) handleLoadMore();
                      }}
                    >
                      {isAppending ? 'Loading...' : 'Load more...'}
                    </Dropdown.Item>
                  )}
                </Dropdown.Menu>
              </div>
            )}
          </div>
        </Col>
      </Row>

      <Row className="cdt-search__selectedRow">
        <Col md={24}>
          <Input
            as="textarea"
            rows={3}
            disabled
            value={
              isByIdLoading
                ? 'Loading...'
                : display.code
                ? `${display.code}${display.desc ? ' – ' + display.desc : ''}`
                : ''
            }
            className="cdt-search__selected"
          />
        </Col>
      </Row>
    </div>
  );
};

export default CdtCodeSearch;
