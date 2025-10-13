import { FormData } from '@/types/incident';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Calendar as CalendarIcon, Clock as ClockIcon } from 'lucide-react';
import React from 'react';
import { useSelector } from 'react-redux';

interface BasicIncidentInfoProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
}

function InputGroup({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  const mode = useSelector((state: any) => state.ui.mode);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        border: mode === 'light' ? '1px solid rgb(212 212 212)' : '1px solid #3a3a3a',
        borderRadius: 8,
        overflow: 'hidden',
        height: 40
      }}
    >
      <div
        style={{
          width: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: mode === 'light' ? '1px solid rgb(212 212 212)' : '1px solid #3a3a3a '
        }}
      >
        {icon}
      </div>
      {children}
    </div>
  );
}

export const BasicIncidentInfo = ({ formData, setFormData }: BasicIncidentInfoProps) => {
  const fld = { height: 40, fontSize: 14 } as const;

  return (
    <Card className="!rounded-[12px] !border  !shadow-sm">
      <CardHeader className="!py-3 !px-4 !border-b ">
        <CardTitle className="!text-[18px] !font-semibold !text-[hsl(var(--foreground))]">
          Basic Incident Information
        </CardTitle>
      </CardHeader>

      <CardContent className="form-strict !space-y-4 !p-4">
        {/* Title + Incident ID */}
        <div className="!grid !gap-4 md:!grid-cols-2">
          <div className="!space-y-2">
            <Label className="!text-[12px] !font-medium">Incident Title *</Label>
            <Input
              id="title"
              placeholder="Brief description of the incident"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
              className="!h-10 !text-[14px] placeholder:!text-[hsl(var(--muted-foreground))]"
            />
          </div>

          <div className="!space-y-2">
            <Label className="!text-[12px] !font-medium">Incident ID</Label>
            <Input
              placeholder="Auto-generated: INC-2024-001"
              value={`INC-${new Date().getFullYear()}-${String(
                Math.floor(Math.random() * 1000)
              ).padStart(3, '0')}`}
              disabled
              style={{ ...fld, backgroundColor: '#F7F8FA' }}
            />
          </div>
        </div>

        {/* Severity / Priority / Risk */}
        <div className="!grid !gap-4 md:!grid-cols-3">
          <div className="!space-y-2">
            <Label className="!text-[12px] !font-medium">Severity Level *</Label>
            <Select
              value={formData.severity}
              onValueChange={v => setFormData({ ...formData, severity: v })}
            >
              <SelectTrigger style={fld}>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="level-1">Level 1 - Near Miss</SelectItem>
                <SelectItem value="level-2">Level 2 - Minor Incident</SelectItem>
                <SelectItem value="level-3">Level 3 - Moderate Incident</SelectItem>
                <SelectItem value="level-4">Level 4 - Major Incident</SelectItem>
                <SelectItem value="level-5">Level 5 - Catastrophic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="!space-y-2">
            <Label className="!text-[12px] !font-medium">Priority *</Label>
            <Select
              value={formData.priority}
              onValueChange={v => setFormData({ ...formData, priority: v })}
            >
              <SelectTrigger style={fld}>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="!space-y-2">
            <Label className="!text-[12px] !font-medium">Risk Level *</Label>
            <Select
              value={formData.riskLevel}
              onValueChange={v => setFormData({ ...formData, riskLevel: v })}
            >
              <SelectTrigger style={fld}>
                <SelectValue placeholder="Risk assessment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="very-low">Very Low (1-2)</SelectItem>
                <SelectItem value="low">Low (3-4)</SelectItem>
                <SelectItem value="moderate">Moderate (5-9)</SelectItem>
                <SelectItem value="high">High (10-14)</SelectItem>
                <SelectItem value="extreme">Extreme (15-25)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Department / Category */}
        <div className="!grid !gap-4 md:!grid-cols-2">
          <div className="!space-y-2">
            <Label className="!text-[12px] !font-medium">Department *</Label>
            <Select
              value={formData.department}
              onValueChange={v => setFormData({ ...formData, department: v })}
            >
              <SelectTrigger style={fld}>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emergency">Emergency Department</SelectItem>
                <SelectItem value="icu">Intensive Care Unit</SelectItem>
                <SelectItem value="surgery">Surgery Department</SelectItem>
                <SelectItem value="pediatrics">Pediatrics</SelectItem>
                <SelectItem value="cardiology">Cardiology</SelectItem>
                <SelectItem value="pharmacy">Pharmacy</SelectItem>
                <SelectItem value="radiology">Radiology</SelectItem>
                <SelectItem value="laboratory">Laboratory</SelectItem>
                <SelectItem value="maternity">Maternity Ward</SelectItem>
                <SelectItem value="oncology">Oncology</SelectItem>
                <SelectItem value="psychiatry">Psychiatry</SelectItem>
                <SelectItem value="rehabilitation">Rehabilitation</SelectItem>
                <SelectItem value="outpatient">Outpatient Clinic</SelectItem>
                <SelectItem value="administration">Administration</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="!space-y-2">
            <Label className="!text-[12px] !font-medium">Primary Category *</Label>
            <Select
              value={formData.category}
              onValueChange={v => setFormData({ ...formData, category: v })}
            >
              <SelectTrigger style={fld}>
                <SelectValue placeholder="Select primary category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medication">Medication Error</SelectItem>
                <SelectItem value="fall">Patient Fall</SelectItem>
                <SelectItem value="equipment">Equipment Failure/Malfunction</SelectItem>
                <SelectItem value="infection">Healthcare-Associated Infection</SelectItem>
                <SelectItem value="communication">Communication Breakdown</SelectItem>
                <SelectItem value="security">Security Incident</SelectItem>
                <SelectItem value="surgical">Surgical Complication</SelectItem>
                <SelectItem value="transfusion">Blood Transfusion Error</SelectItem>
                <SelectItem value="diagnostic">Diagnostic Error</SelectItem>
                <SelectItem value="pressure-injury">Pressure Injury</SelectItem>
                <SelectItem value="violence">Workplace Violence</SelectItem>
                <SelectItem value="fire-safety">Fire/Safety Incident</SelectItem>
                <SelectItem value="data-breach">Data Privacy Breach</SelectItem>
                <SelectItem value="environmental">Environmental Hazard</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Location / Building / Date / Time */}
        <div className="!grid !gap-4 md:!grid-cols-4">
          <div className="!space-y-2">
            <Label className="!text-[12px] !font-medium">Specific Location *</Label>
            <Input
              placeholder="Room 301, OR-2, ICU Bay 5"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              required
              style={fld}
            />
          </div>

          <div className="!space-y-2">
            <Label className="!text-[12px] !font-medium">Building/Wing</Label>
            <Input
              placeholder="Main Building, East Wing"
              value={formData.building}
              onChange={e => setFormData({ ...formData, building: e.target.value })}
              style={fld}
            />
          </div>

          <div className="!space-y-2">
            <Label className="!text-[12px] !font-medium">Date of Incident *</Label>
            <InputGroup icon={<CalendarIcon size={16} color="#6B7280" />}>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                required
                style={{
                  ...fld,
                  height: 38,
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  padding: '0 12px',
                  background: 'transparent'
                }}
              />
            </InputGroup>
          </div>

          <div className="!space-y-2">
            <Label className="!text-[12px] !font-medium">Time of Incident *</Label>
            <InputGroup icon={<ClockIcon size={16} color="#6B7280" />}>
              <input
                type="time"
                value={formData.time}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
                required
                style={{
                  ...fld,
                  height: 38,
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  padding: '0 12px',
                  background: 'transparent'
                }}
              />
            </InputGroup>
          </div>
        </div>

        {/* Description */}
        <div className="!space-y-2">
          <Label className="!text-[12px] !font-medium">Detailed Description *</Label>
          <Textarea
            placeholder="Provide a comprehensive description of the incident including sequence of events, contributing factors, and immediate outcomes..."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            required
            style={{ fontSize: 14, minHeight: 170 }}
          />
        </div>
      </CardContent>
    </Card>
  );
};
