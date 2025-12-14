import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Col,
  Dropdown,
  Input,
  InputGroup,
  Row,
  Text,
  Loader,
  Button,
  Whisper,
  Tooltip,
  Stack
} from 'rsuite';
import SearchIcon from '@rsuite/icons/Search';
import TrashIcon from '@rsuite/icons/Trash';
import CloseIcon from '@rsuite/icons/Close';
import CheckIcon from '@rsuite/icons/Check';
import EditIcon from '@rsuite/icons/Edit';
import { useLazySearchIcd10Query } from '../../services/setup/icd10service';

import './styles.less';
import Translate from '../Translate';

type Mode = 'singleICD10' | 'multiICD10';

type Props = {
  object: any;
  setOpject: (next: any | ((prev: any) => any)) => void;
  fieldName: string;
  label?: string;
  disabled?: boolean;
  mode?: Mode;
  required?: boolean;
};


const Icd10Search: React.FC<Props> = ({
  object,
  setOpject,
  fieldName,
  mode = 'singleICD10',
  required,
  ...props
}) => {
  const [value, setValue] = useState('');
  console.log("Value",value)
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const size = 30;
  const sort = 'id,asc';
  const [openList, setOpenList] = useState(false);
  const [picked, setPicked] = useState<any | null>(null);
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);
  const [isTextareaEditable, setIsTextareaEditable] = useState(false);

  const textFromParent: string =
    mode === 'multiICD10' ? String(object?.[fieldName] ?? '') : '';
  
  const isInternalUpdateRef = useRef(false);

  const [triggerSearch, { /* isFetching, isLoading, */ isUninitialized, error }] =
    useLazySearchIcd10Query();


  const [selfLoading, setSelfLoading] = useState(false);

  const keyword = (value || '').trim();
  const instanceId = `${fieldName}-${mode}`;

  const runSearch = async (reset = true) => {
    console.log("KEyword",keyword)
    if (!keyword) return;
    const nextPage = reset ? 0 : page + 1;

    setSelfLoading(true);
    try {
      const res = await triggerSearch({ keyword, page: nextPage, size, sort }).unwrap();

      const pageData =
        (res?.data ?? []).map((it: any) => ({
          id: it.id,
          code: it.code,
          description: it.description
        })) || [];

      setItems(prev => {
        if (reset) return pageData;
        const seen = new Set(prev.map(p => String(p.id)));
        return [...prev, ...pageData.filter(p => !seen.has(String(p.id)))];
      });

      setTotal(res?.totalCount ?? 0);
      setPage(nextPage);
      setOpenList(true);
    } finally {
      setSelfLoading(false);
    }
  };

  const hasMore = items.length < total && !selfLoading;

  const selectedItem = useMemo(
    () => {
      if (mode !== 'singleICD10') return null;
      return picked ?? items.find(it => String(it.id) === String(object?.[fieldName])) ?? null;
    },
    [picked, items, object, fieldName, mode, instanceId]
  );

  const getAddedItemsSet = useMemo(() => {
    if (mode !== 'multiICD10' || !textFromParent) return new Set<string>();
    const lines = textFromParent.split('\n').map(l => l.trim()).filter(l => l);
    return new Set(lines);
  }, [textFromParent, mode, instanceId]);

  const isItemAdded = (mod: any) => {
    if (mode !== 'multiICD10') return false;
    const line = `${mod.code} — ${mod.description}`;
    return getAddedItemsSet.has(line.trim());
  };

  const removeItem = (mod: any) => {
    if (mode !== 'multiICD10') return;
    const line = `${mod.code} — ${mod.description}`;
    isInternalUpdateRef.current = true;
    setOpject((prev: any) => {
      const currentText = String(prev?.[fieldName] ?? '').trim();
      if (!currentText) return prev;
      const lines = currentText.split('\n').map(l => l.trim()).filter(l => l);
      const filteredLines = lines.filter(l => l !== line.trim());
      const next = filteredLines.join('\n');
      return { ...prev, [fieldName]: next };
    });
    setTimeout(() => {
      isInternalUpdateRef.current = false;
    }, 100);
  };

  const selectAndClose = (mod: any) => {
    if (mode === 'singleICD10') {
      setOpject((prev: any) => {
        const updated = { ...prev, [fieldName]: mod.id };
        return updated;
      });
      setPicked(mod);
      setValue('');
      setOpenList(false);
    } else {
      isInternalUpdateRef.current = true;
      setOpject((prev: any) => {
        const currentText = String(prev?.[fieldName] ?? '').trim();
        const line = `${mod.code} — ${mod.description}`;
        let next: string;
        if (!currentText) {
          next = line;
        } else {
          const lines = currentText.split('\n').map(l => l.trim());
          const newLine = line.trim();
          if (lines.includes(newLine)) {
            next = currentText;
          } else {
            next = `${currentText}\n${line}`;
          }
        }
        return { ...prev, [fieldName]: next };
      });
      
      // Reset the flag after a short delay
      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 100);

      setAddedFeedback(mod.code);
      setTimeout(() => setAddedFeedback(null), 2000);
      
      setValue('');
    }
  };


  useEffect(() => {
    if (!keyword) {
      setOpenList(false);
      setItems([]);
      setTotal(0);
      setPage(0);
    }
  }, [keyword, instanceId]);

  const listRef = useRef<HTMLDivElement | null>(null);

  const highlight = (text: string) => {
    if (!keyword) return text;
    try {
      const rx = new RegExp(
        `(${keyword.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})`,
        'ig'
      );
      return (
        <span
          dangerouslySetInnerHTML={{
            __html: String(text || '').replace(rx, '<mark>$1</mark>')
          }}
        />
      );
    } catch {
      return text;
    }
  };

  const clearSearch = () => {
    setValue('');
    setOpenList(false);
    setItems([]);
    setTotal(0);
    setPage(0);
  };

  const clearTextarea = () => {
    if (mode === 'multiICD10') {
      isInternalUpdateRef.current = true;
      setOpject((prev: any) => ({ ...prev, [fieldName]: '' }));
      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 100);
      setAddedFeedback(null);
    }
  };

  const clearAll = () => {
    if (mode === 'singleICD10') {
      setPicked(null);
      setOpject((prev: any) => ({ ...prev, [fieldName]: null }));
      setValue('');
      setOpenList(false);
      setItems([]);
    }
  };

  const currentTextValue = mode === 'multiICD10' ? textFromParent : '';
  const hasContent = mode === 'multiICD10' ? !!currentTextValue.trim() : !!selectedItem;

  return (
    <div key={instanceId} data-instance-id={instanceId} className="icd10-root">
      <Row>
          <Text>
            <Translate>
              {props?.label ?? (mode === 'singleICD10' ? 'Diagnosis (ICD-10)' : 'Select ICD-10 Codes')}
            </Translate>
              {required && <span style={{ color: 'var(--primary-pink)' }}> *</span>}
          </Text>
        <Col md={24}>
          <div className="search-wrap">
            <InputGroup className="search-group" inside>
              <Input
                placeholder={
                  mode === 'singleICD10'
                    ? 'Search by code or description'
                    : 'Search indication by code or description'
                }
                value={value}
                onChange={(val) => setValue(String(val))}
                onPressEnter={() => runSearch(true)}
                disabled={!!props?.disabled}
                className="search-input"
              />
              <InputGroup.Button
                className={`search-btn ${keyword ? 'active' : ''}`}
                onClick={() => runSearch(true)}
                disabled={!!props?.disabled || !keyword || selfLoading}
                aria-label="Search"
              >
                {selfLoading ? <Loader /> : <SearchIcon />}
              </InputGroup.Button>
              {mode === 'multiICD10' && value && (
                <Whisper placement="top" speaker={<Tooltip><Translate>Clear search</Translate></Tooltip>}>
                  <InputGroup.Button
                    className="clear-btn"
                    onClick={clearSearch}
                    disabled={!!props?.disabled}
                    aria-label="Clear search"
                  >
                    <TrashIcon />
                  </InputGroup.Button>
                </Whisper>
              )}
              {mode === 'singleICD10' && hasContent && (
                <Whisper placement="top" speaker={<Tooltip><Translate>Clear selection</Translate></Tooltip>}>
                  <InputGroup.Button
                    className="clear-icon-btn"
                    onClick={clearAll}
                    disabled={!!props?.disabled}
                    aria-label="Clear"
                  >
                    <TrashIcon />
                  </InputGroup.Button>
                </Whisper>
              )}
            </InputGroup>

            {openList && (
              <div
                className={`dropdown-list-${instanceId} dropdown-list`}
                ref={listRef}
                data-instance-id={instanceId}
              >
                <Dropdown.Menu style={{ width: '100%' }}>
                  {!selfLoading && items.length === 0 && (
                    <div className="empty">
                      {isUninitialized ? (
                        <span><Translate>Type a keyword and click search to find ICD-10 codes</Translate></span>
                      ) : (
                        <span><Translate>No results found. Try a different keyword.</Translate></span>
                      )}
                    </div>
                  )}

                  {items.map(mod => {
                    const isJustAdded = addedFeedback === mod.code;
                    const alreadyAdded = isItemAdded(mod);
                    const showAddedState = alreadyAdded || isJustAdded;
                    
                    return (
                      <Dropdown.Item
                        key={String(mod.id)}
                        eventKey={String(mod.id)}
                        onClick={() => !alreadyAdded && selectAndClose(mod)}
                        className={`dropdown-item ${showAddedState ? 'added' : ''} ${alreadyAdded ? 'disabled' : ''}`}
                        onMouseEnter={(e) => {
                          if (!showAddedState) {
                            (e.currentTarget as HTMLDivElement).classList.add('hover');
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!showAddedState) {
                            (e.currentTarget as HTMLDivElement).classList.remove('hover');
                          }
                        }}
                      >
                        <div className="item-row">
                          <div className="item-col">
                            <div>
                              <strong className="code">{highlight(mod.code)}</strong>
                              <span className="dash">—</span>
                              <span className="desc">{highlight(mod.description)}</span>
                            </div>
                          </div>
                          {mode === 'multiICD10' && (
                            <>
                              {alreadyAdded ? (
                                <div className="added-actions">
                                  <CheckIcon className="check" />
                                  <Whisper placement="left" speaker={<Tooltip><Translate>Remove</Translate></Tooltip>}>
                                    <Button
                                      size="xs"
                                      appearance="subtle"
                                      className="remove-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeItem(mod);
                                      }}
                                    >
                                      <CloseIcon />
                                    </Button>
                                  </Whisper>
                                </div>
                              ) : (
                                <Whisper placement="left" speaker={<Tooltip><Translate>Click to add</Translate></Tooltip>}>
                                  <Button
                                    size="xs"
                                    appearance="subtle"
                                    className="add-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      selectAndClose(mod);
                                    }}
                                  >
                                    <Translate>+ Add</Translate>
                                  </Button>
                                </Whisper>
                              )}
                            </>
                          )}
                        </div>
                      </Dropdown.Item>
                    );
                  })}

                  {selfLoading && (
                    <div className="loading">
                      <Loader /> <span><Translate>Loading results…</Translate></span>
                    </div>
                  )}

                  {hasMore && (
                    <div className="load-more">
                      <Button 
                        appearance="subtle" 
                        onClick={() => runSearch(false)}
                        className="load-more-btn"
                        disabled={selfLoading}
                      >
                        <Translate>Load more</Translate> ({total - items.length} <Translate>remaining</Translate>)
                      </Button>
                    </div>
                  )}
                </Dropdown.Menu>
              </div>
            )}

            {error && (
              <div className="error">
                <CloseIcon className="error-icon" />
                <span><Translate>Failed to fetch results. Please try again.</Translate></span>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {mode === 'singleICD10' ? (
        <Row style={{ marginTop: 12 }}>
          <Col md={24}>
            <div className={`summary ${selectedItem ? 'selected' : ''}`}>
              {selectedItem ? (
                <div className="summary-row">
                  <CheckIcon className="summary-check" />
                  <span className="summary-text">
                    <strong className="code-blue">{selectedItem.code}</strong>
                    <span className="summary-sep">—</span>
                    <span>{selectedItem.description}</span>
                  </span>
                </div>
              ) : (
                <span className="summary-empty"><Translate>No diagnosis selected</Translate></span>
              )}
            </div>
          </Col>
        </Row>
      ) : (
        <Row style={{ marginTop: 12 }}>
          <Col md={24}>
            <div className="indications-wrap">
              <div className="indications-editor">
                <textarea
                  placeholder={'Click search results above to add indications, or type freely here...\n\nEach indication will appear on a new line.'}
                  value={textFromParent}
                  disabled={!!props?.disabled}
                  readOnly={!isTextareaEditable && !props?.disabled}
                  className={`indications-textarea ${(!isTextareaEditable && !props?.disabled) ? 'readonly' : ''}`}
                  onChange={(e) => {
                    if (isTextareaEditable && !props?.disabled) {
                      const v = e.target.value;
                      isInternalUpdateRef.current = true;
                      setOpject((prev: any) => ({ ...prev, [fieldName]: v }));
                      setTimeout(() => {
                        isInternalUpdateRef.current = false;
                      }, 100);
                    }
                  }}
                  onFocus={(e) => {
                    if (isTextareaEditable && !props?.disabled) {
                      e.currentTarget.classList.add('focus');
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.classList.remove('focus');
                  }}
                />
                {textFromParent.trim() && (
                  <div className="counter-badge">
                    {(() => {
                      const count = textFromParent.split('\n').filter(line => line.trim()).length;
                      return `${count} ${count === 1 ? 'indication' : 'indications'}`;
                    })()}
                  </div>
                )}
              </div>
              <Stack direction="column" spacing={8}>
                <Whisper placement="left" speaker={<Tooltip><Translate>{isTextareaEditable ? 'Disable editing' : 'Enable editing'}</Translate></Tooltip>}>
                  <Button 
                    appearance={isTextareaEditable ? 'primary' : 'subtle'}
                    onClick={() => setIsTextareaEditable(!isTextareaEditable)}
                    disabled={!!props?.disabled}
                    className={`toggle-edit ${isTextareaEditable ? 'on' : ''}`}
                  >
                    <EditIcon />
                  </Button>
                </Whisper>
                <Whisper placement="left" speaker={<Tooltip><Translate>Clear all ICD 10 codes</Translate></Tooltip>}>
                  <Button 
                    appearance="primary" 
                    color="red"
                    onClick={clearTextarea}
                    disabled={!!props?.disabled || !currentTextValue.trim()}
                    className={`clear-all ${currentTextValue.trim() ? 'enabled' : 'disabled'}`}
                  >
                    <TrashIcon />
                  </Button>
                </Whisper>
              </Stack>
            </div>
            <div className="tip">
              <CheckIcon className="tip-icon" />
              <span>
                <strong><Translate>Tip:</Translate></strong>{' '}
                <Translate>Click any search result above to automatically add it here. You can also type or edit manually. Each indication appears on a new line.</Translate>
              </span>
            </div>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Icd10Search;