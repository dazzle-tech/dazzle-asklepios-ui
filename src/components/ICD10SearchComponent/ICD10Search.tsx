// Icd10Search.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Col, Dropdown, Input, InputGroup, Row, Text, Loader, Button } from 'rsuite';
import SearchIcon from '@rsuite/icons/Search';
import { useLazySearchIcd10Query } from '../../services/setup/icd10service';


type Props = {
  object: any;
  setOpject: (obj: any) => void;
  fieldName: string;
  label?: string;
  disabled?: boolean;
};

const Icd10Search: React.FC<Props> = ({ object, setOpject, fieldName, ...props }) => {
  // single text field for both code & description
  const [value, setValue] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const size = 30;
  const sort = 'id,asc';
  const [openList, setOpenList] = useState(false);

  // keep the picked row so code+description stay visible after selection
  const [picked, setPicked] = useState<any | null>(null);

  const [triggerSearch, { isFetching, isLoading, isUninitialized, error }] =
    useLazySearchIcd10Query();
  const loading = isFetching || isLoading;
  const keyword = (value || '').trim();

  const runSearch = async (reset = true) => {
    if (!keyword) return;
    const nextPage = reset ? 0 : page + 1;

    const res = await triggerSearch({ keyword, page: nextPage, size, sort }).unwrap();

    const pageData =
      (res?.data ?? []).map((it: any) => ({
        id: it.id,
        code: it.code,
        description: it.description,
      })) || [];

    setItems(prev => {
      if (reset) return pageData;
      const seen = new Set(prev.map(p => String(p.id)));
      return [...prev, ...pageData.filter(p => !seen.has(String(p.id)))];
    });

    setTotal(res?.totalCount ?? 0);
    setPage(nextPage);
    setOpenList(true);
  };

  const hasMore = items.length < total && !loading;

  // use the kept selection first; fall back to items if needed
  const selectedItem = useMemo(
    () =>
      picked ??
      items.find(it => String(it.id) === String(object?.[fieldName])) ??
      null,
    [picked, items, object, fieldName]
  );

  const selectAndClose = (mod: any) => {
    setOpject({ ...object, [fieldName]: mod.id });
    setPicked(mod);    // keep selected row (code + description)
    setValue('');
    setOpenList(false);
  };

  // reset list when input is cleared; keep "picked" so the readonly field still shows code — description
  useEffect(() => {
    if (!keyword) {
      setOpenList(false);
      setItems([]);
      setTotal(0);
      setPage(0);
    }
  }, [keyword]);

  const listRef = useRef<HTMLDivElement | null>(null);

  // Optional: highlight matched parts
  const highlight = (text: string) => {
    if (!keyword) return text;
    try {
      const rx = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
      return (
        <span
          dangerouslySetInnerHTML={{
            __html: String(text || '').replace(rx, '<mark>$1</mark>'),
          }}
        />
      );
    } catch {
      return text;
    }
  };

  return (
    <>
      <Row>
        <Text>{props?.label ?? 'Diagnosis (ICD-10)'}</Text>
        <Col md={24}>
          <div style={{ position: 'relative' }}>
            <InputGroup style={{ height: 32 }} inside>
              <Input
                placeholder="Search by code or description"
                value={value}
                onChange={setValue}
                onPressEnter={() => runSearch(true)}
                disabled={!!props?.disabled}
              />
              <InputGroup.Button
                style={{ height: 32 }}
                onClick={() => runSearch(true)}
                disabled={!!props?.disabled || !keyword}
                aria-label="Search"
              >
                {loading ? <Loader /> : <SearchIcon />}
              </InputGroup.Button>
            </InputGroup>

            {openList && (
              <div
                className="dropdown-list"
                ref={listRef}
                style={{
                  maxHeight: 280,
                  overflowY: 'auto',
                  border: '1px solid var(--rs-border-primary, #e5e5ea)',
                  borderRadius: 6,
                  background: 'var(--rs-bg-overlay, #fff)',
                  position: 'absolute',
                  zIndex: 10,
                  width: '100%',
                  marginTop: 6,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                }}
              >
                <Dropdown.Menu style={{ width: '100%' }}>
                  {!loading && items.length === 0 && (
                    <div style={{ padding: 12, color: '#999' }}>
                      {isUninitialized ? 'Type a keyword and search.' : 'No results.'}
                    </div>
                  )}

                  {items.map(mod => (
                    <Dropdown.Item
                      key={String(mod.id)}
                      eventKey={String(mod.id)}
                      onClick={() => selectAndClose(mod)}
                      style={{
                        whiteSpace: 'normal',
                        lineHeight: 1.3,
                        paddingTop: 8,
                        paddingBottom: 8,
                      }}
                    >
                      {/* Show on ONE line: CODE — Description */}
                      <div>
                        <strong>{highlight(mod.code)}</strong>
                        <span> — </span>
                        <span>{highlight(mod.description)}</span>
                      </div>
                    </Dropdown.Item>
                  ))}

                  {loading && (
                    <div style={{ padding: 12 }}>
                      <Loader /> <span style={{ marginInlineStart: 8 }}>Loading…</span>
                    </div>
                  )}

                  {hasMore && (
                    <div style={{ padding: 8, textAlign: 'center' }}>
                      <Button appearance="link" onClick={() => runSearch(false)}>
                        Load more
                      </Button>
                    </div>
                  )}
                </Dropdown.Menu>
              </div>
            )}

            {error && (
              <div style={{ color: '#d93025', marginTop: 6 }}>
                Failed to fetch. Please try again.
              </div>
            )}
          </div>
        </Col>
      </Row>

      <Row style={{ marginTop: 8 }}>
        <Col md={24}>
          <InputGroup style={{ height: 32 }}>
            <Input
              disabled
              value={
                selectedItem
                  ? `${selectedItem.code} — ${selectedItem.description}`
                  : ''
              }
              placeholder=""
            />
          </InputGroup>
        </Col>
      </Row>
    </>
  );
};

export default Icd10Search;
