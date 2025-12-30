import React, { useState, useEffect } from 'react';
import { Modal, Button, Tabs, Input, InputGroup, IconButton, SelectPicker } from 'rsuite';
import { IoMdClose } from 'react-icons/io';
import { FaPlus, FaCog } from 'react-icons/fa';
import Translate from '@/components/Translate';

interface AvailabilitySlot {
  start: number;
  end: number;
  duration: number;
}

interface AvailabilityDay {
  day_of_week: number;
  slots: AvailabilitySlot[];
}

interface AvailabilityTemplate {
  id: string;
  departmentId: string;
  description: string;
  availability_json: string;
  deleted_by?: string;
  deleted_at?: string;
  is_valid: boolean;
}

interface ResourceColumn {
  id: string;
  name: string;
  resourceValue: string;
  slots: AvailabilitySlot[];
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => {
  const hour = 8 + i;
  return hour * 60; // Convert to minutes since midnight
});

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const PRACTITIONERS = [
  { value: 'general', label: 'General' },
  { value: 'dr_ahmad', label: 'Dr. Ahmad' },
  { value: 'dr_sarah', label: 'Dr. Sarah' },
  { value: 'dr_mohammed', label: 'Dr. Mohammed' },
  { value: 'dr_fatima', label: 'Dr. Fatima' }
];

const EditAvailabilityTemplateModal: React.FC<{
  open: boolean;
  setOpen: (open: boolean) => void;
  template: AvailabilityTemplate | null;
  setTemplate: (template: AvailabilityTemplate | null) => void;
  width: number;
  handleSave: (template: AvailabilityTemplate) => void;
}> = ({ open, setOpen, template, setTemplate, width, handleSave }) => {
  const [activeDay, setActiveDay] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [resourceColumns, setResourceColumns] = useState<ResourceColumn[]>([
    { id: 'general_1', name: 'General', resourceValue: 'general', slots: [] },
    { id: 'general_2', name: 'General', resourceValue: 'general', slots: [] },
    { id: 'general_3', name: 'General', resourceValue: 'general', slots: [] }
  ]);
  const [availabilityData, setAvailabilityData] = useState<AvailabilityDay[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchStartTime, setBatchStartTime] = useState<string>('08:00');
  const [batchEndTime, setBatchEndTime] = useState<string>('16:00');
  const [batchDuration, setBatchDuration] = useState<number>(30);
  const [showPractitionerModal, setShowPractitionerModal] = useState(false);
  const [selectedPractitioner, setSelectedPractitioner] = useState<string>('');
  const [customizeColumnId, setCustomizeColumnId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragColumnId, setDragColumnId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);

  useEffect(() => {
    const onMouseUp = () => {
      if (isDragging) endDrag();
    };
    window.addEventListener('mouseup', onMouseUp);
    return () => window.removeEventListener('mouseup', onMouseUp);
  }, [isDragging]);

  useEffect(() => {
    if (template) {
      setDescription(template.description);
      setDepartmentId(template.departmentId);
      try {
        const parsed = JSON.parse(template.availability_json);
        setAvailabilityData(parsed.days || []);
      } catch (error) {
        setAvailabilityData([]);
      }
    }
  }, [template]);

  useEffect(() => {
    const daySlots = availabilityData.find(d => d.day_of_week === activeDay)?.slots ?? [];
    setResourceColumns(cols => cols.map(c => ({ ...c, slots: daySlots })));
  }, [activeDay, availabilityData]);

  const parseTimeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(x => parseInt(x, 10));
    if (Number.isNaN(h) || Number.isNaN(m)) return 0;
    return h * 60 + m;
  };

  const buildUnionSlots = (columns: ResourceColumn[]) => {
    const byKey = new Map<string, AvailabilitySlot>();
    for (const c of columns) {
      for (const s of c.slots) {
        const k = `${s.start}-${s.end}-${s.duration}`;
        byKey.set(k, s);
      }
    }
    return Array.from(byKey.values()).sort((a, b) => a.start - b.start);
  };

  const upsertActiveDaySlots = (slots: AvailabilitySlot[]) => {
    setAvailabilityData(prev => {
      const rest = prev.filter(d => d.day_of_week !== activeDay);
      return [...rest, { day_of_week: activeDay, slots }];
    });
  };

  const handleSaveTemplate = () => {
    if (!template) return;

    const unionSlots = buildUnionSlots(resourceColumns);
    const nextDays = (() => {
      const rest = availabilityData.filter(d => d.day_of_week !== activeDay);
      return [...rest, { day_of_week: activeDay, slots: unionSlots }];
    })();

    const updatedTemplate: AvailabilityTemplate = {
      ...template,
      description,
      departmentId,
      availability_json: JSON.stringify({ days: nextDays })
    };

    handleSave(updatedTemplate);
  };

  const handleCancel = () => {
    setOpen(false);
    setTemplate(null);
  };

  const addResourceColumn = () => {
    const newId = `resource_${Date.now()}`;
    setResourceColumns([...resourceColumns, { id: newId, name: 'General', resourceValue: 'general', slots: [] }]);
  };

  const applyPractitionerToColumn = () => {
    if (!customizeColumnId) return;
    const practitioner = PRACTITIONERS.find(p => p.value === selectedPractitioner);
    if (!practitioner) return;
    setResourceColumns(cols =>
      cols.map(c =>
        c.id === customizeColumnId
          ? { ...c, name: practitioner.label, resourceValue: practitioner.value }
          : c
      )
    );
    setSelectedPractitioner('');
    setCustomizeColumnId(null);
    setShowPractitionerModal(false);
  };

  const generateBatchSlots = () => {
    const startMinutes = parseTimeToMinutes(batchStartTime);
    const endMinutes = parseTimeToMinutes(batchEndTime);
    
    const newSlots: AvailabilitySlot[] = [];
    for (let time = startMinutes; time + batchDuration <= endMinutes; time += batchDuration) {
      newSlots.push({
        start: time,
        end: time + batchDuration,
        duration: batchDuration
      });
    }
    
    setResourceColumns(columns => columns.map(col => ({ ...col, slots: newSlots })));
    upsertActiveDaySlots(newSlots);
    
    setShowBatchModal(false);
  };

  const removeResourceColumn = (columnId: string) => {
    setResourceColumns(resourceColumns.filter(col => col.id !== columnId));
  };

  const removeSlot = (columnId: string, slotIndex: number) => {
    setResourceColumns(columns => {
      const next = columns.map(col =>
        col.id === columnId ? { ...col, slots: col.slots.filter((_, idx) => idx !== slotIndex) } : col
      );
      const union = buildUnionSlots(next);
      upsertActiveDaySlots(union);
      return next;
    });
  };

  const startDrag = (columnId: string, time: number) => {
    setIsDragging(true);
    setDragColumnId(columnId);
    setDragStart(time);
    setDragEnd(time);
  };

  const moveDrag = (columnId: string, time: number) => {
    if (!isDragging) return;
    if (dragColumnId !== columnId) return;
    setDragEnd(time);
  };

  const endDrag = () => {
    if (!isDragging || !dragColumnId || dragStart == null || dragEnd == null) {
      setIsDragging(false);
      setDragColumnId(null);
      setDragStart(null);
      setDragEnd(null);
      return;
    }

    const start = Math.min(dragStart, dragEnd);
    const end = Math.max(dragStart, dragEnd) + batchDuration;

    const newSlot: AvailabilitySlot = { start, end, duration: batchDuration };
    setResourceColumns(cols => {
      const next = cols.map(c =>
        c.id === dragColumnId ? { ...c, slots: [...c.slots, newSlot] } : c
      );
      const union = buildUnionSlots(next);
      upsertActiveDaySlots(union);
      return next;
    });

    setIsDragging(false);
    setDragColumnId(null);
    setDragStart(null);
    setDragEnd(null);
  };

  const renderTimeSlot = (time: number) => (
    <div key={time} style={{ 
      height: '40px', 
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      color: '#666'
    }}>
      {formatTime(time)}
    </div>
  );

  const renderResourceColumn = (column: ResourceColumn) => (
    <div key={column.id} style={{ 
      flex: 1, 
      border: '1px solid #e0e0e0',
      borderRadius: '4px',
      margin: '0 4px',
      padding: '8px',
      backgroundColor: '#f9f9f9',
      userSelect: 'none'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '8px',
        paddingBottom: '8px',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <strong>{column.name}</strong>
        <div style={{ display: 'flex', gap: '4px' }}>
          <IconButton 
            icon={<FaCog />} 
            size="xs" 
            onClick={() => {
              setCustomizeColumnId(column.id);
              setShowPractitionerModal(true);
            }}
            appearance="subtle"
            title="Customize"
          />
          <IconButton 
            icon={<IoMdClose />} 
            size="xs" 
            onClick={() => removeResourceColumn(column.id)}
            appearance="subtle"
          />
        </div>
      </div>
      
      <div style={{ height: '680px', position: 'relative' }}>
        {TIME_SLOTS.map(time => {
          const slot = column.slots.find(s => s.start === time);
          const gridStepMinutes = TIME_SLOTS.length > 1 ? (TIME_SLOTS[1] - TIME_SLOTS[0]) : 60;
          const rowHeightPx = 40;
          const slotHeightPx = slot
            ? Math.max(
                rowHeightPx - 4,
                Math.round(((slot.end - slot.start) / gridStepMinutes) * rowHeightPx) - 4
              )
            : 0;
          const isActiveDrag =
            isDragging &&
            dragColumnId === column.id &&
            dragStart != null &&
            dragEnd != null &&
            time >= Math.min(dragStart, dragEnd) &&
            time <= Math.max(dragStart, dragEnd);
          return (
            <div key={time} style={{ 
              height: '40px', 
              borderBottom: '1px solid #e0e0e0',
              position: 'relative',
              backgroundColor: isActiveDrag ? '#e3f2fd' : undefined,
              cursor: 'crosshair'
            }}>
              <div
                style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: slot ? 'none' : 'auto' }}
                onMouseDown={() => startDrag(column.id, time)}
                onMouseEnter={() => moveDrag(column.id, time)}
                onMouseUp={endDrag}
                onMouseLeave={() => {
                  if (isDragging && dragColumnId === column.id) return;
                }}
              />
              {slot && (
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: '2px',
                  right: '2px',
                  height: `${slotHeightPx}px`,
                  backgroundColor: '#e3f2fd',
                  border: '1px solid #2196f3',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 8px',
                  fontSize: '12px',
                  zIndex: 1
                }}>
                  <span>{formatTime(slot.start)} - {formatTime(slot.end)}</span>
                  <span>Slots: {slot.duration} mins</span>
                  <IconButton 
                    icon={<IoMdClose />} 
                    size="xs" 
                    onClick={() => removeSlot(column.id, column.slots.indexOf(slot))}
                    appearance="subtle"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <Button 
        appearance="ghost" 
        size="sm" 
        block 
        onClick={() => setShowBatchModal(true)}
        style={{ marginTop: '8px' }}
      >
        <FaPlus /> Generate Slots
      </Button>
    </div>
  );

  return (
    <Modal 
      open={open} 
      onClose={handleCancel}
      size="lg"
      style={{ width: width > 1200 ? '90%' : '95%', maxWidth: '1400px' }}
    >
      <Modal.Header>
        <Modal.Title>Edit Availability Template</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ marginBottom: '6px', fontWeight: 600 }}>
              <Translate>Department</Translate>
            </div>
            <InputGroup>
              <Input 
                placeholder="Department" 
                value={departmentId}
                onChange={setDepartmentId}
              />
            </InputGroup>
          </div>

          <div>
            <div style={{ marginBottom: '6px', fontWeight: 600 }}>
              <Translate>Template Description</Translate>
            </div>
            <InputGroup>
              <Input 
                placeholder="Template Description" 
                value={description}
                onChange={setDescription}
              />
            </InputGroup>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
          <Button appearance="primary" onClick={() => setShowBatchModal(true)}>
            Generate
          </Button>
        </div>

        <Tabs 
          activeKey={activeDay} 
          onSelect={(activeKey) => setActiveDay(activeKey as number)}
          appearance="subtle"
        >
          {DAYS_OF_WEEK.map(day => (
            <Tabs.Tab 
              key={day.value} 
              eventKey={day.value} 
              title={day.label}
              style={{ padding: '0' }}
            />
          ))}
        </Tabs>

        <div style={{ display: 'flex', marginTop: '20px' }}>
          {/* Time column */}
          <div style={{ width: '80px', flexShrink: 0 }}>
            <div style={{ 
              height: '40px', 
              borderBottom: '2px solid #e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              Time
            </div>
            {TIME_SLOTS.map(renderTimeSlot)}
          </div>

          {/* Resource columns */}
          <div style={{ flex: 1, display: 'flex', overflowX: 'auto' }}>
            {resourceColumns.map(renderResourceColumn)}
            
            {/* Add column button */}
          <div style={{ 
            width: '120px', 
            border: '2px dashed #ccc',
            borderRadius: '4px',
            margin: '0 4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          onClick={addResourceColumn}
          >
            <div style={{ textAlign: 'center', color: '#666' }}>
              <FaPlus size={24} />
              <div style={{ fontSize: '12px', marginTop: '8px' }}>Add Column</div>
            </div>
          </div>
        </div>
      </div>
      </Modal.Body>
      
      <Modal.Footer>
        <Button onClick={handleCancel} appearance="subtle">
          Cancel
        </Button>
        <Button onClick={handleSaveTemplate} appearance="primary" color="blue">
          Save Template
        </Button>
      </Modal.Footer>

      {/* Batch Generate Modal */}
      <Modal open={showBatchModal} onClose={() => setShowBatchModal(false)} size="sm">
        <Modal.Header>
          <Modal.Title>Generate Time Slots</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ marginBottom: '10px' }}>
            <label>Start Time:</label>
            <Input value={batchStartTime} onChange={setBatchStartTime} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>End Time:</label>
            <Input value={batchEndTime} onChange={setBatchEndTime} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Duration (minutes):</label>
            <Input type="number" value={batchDuration} onChange={(value) => setBatchDuration(parseInt(value) || 30)} />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setShowBatchModal(false)} appearance="subtle">
            Cancel
          </Button>
          <Button onClick={generateBatchSlots} appearance="primary">
            Generate
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Practitioner Selection Modal */}
      <Modal open={showPractitionerModal} onClose={() => setShowPractitionerModal(false)} size="sm">
        <Modal.Header>
          <Modal.Title>Customize Practitioner</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ marginBottom: '10px' }}>
            <label>Select Practitioner:</label>
            <SelectPicker
              data={PRACTITIONERS}
              value={selectedPractitioner}
              onChange={setSelectedPractitioner}
              block
              placeholder="Choose practitioner"
              searchable
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => setShowPractitionerModal(false)} appearance="subtle">
            Cancel
          </Button>
          <Button onClick={applyPractitionerToColumn} appearance="primary">
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </Modal>
  );
};

export default EditAvailabilityTemplateModal;
