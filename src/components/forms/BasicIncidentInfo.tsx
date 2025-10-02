import { FormData } from "@/types/incident";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BasicIncidentInfoProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
}

export const BasicIncidentInfo = ({ formData, setFormData }: BasicIncidentInfoProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium text-foreground">
          Basic Incident Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Incident Title *</Label>
            <Input
              id="title"
              placeholder="Brief description of the incident"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="incidentId">Incident ID</Label>
            <Input
              id="incidentId"
              placeholder="Auto-generated: INC-2024-001"
              value={`INC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`}
              disabled
              className="bg-muted"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="severity">Severity Level *</Label>
            <Select
              value={formData.severity}
              onValueChange={(value) => setFormData({ ...formData, severity: value })}
            >
              <SelectTrigger>
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
          <div className="space-y-2">
            <Label htmlFor="priority">Priority *</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
            >
              <SelectTrigger>
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
          <div className="space-y-2">
            <Label htmlFor="riskLevel">Risk Level *</Label>
            <Select
              value={formData.riskLevel}
              onValueChange={(value) => setFormData({ ...formData, riskLevel: value })}
            >
              <SelectTrigger>
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

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <Select
              value={formData.department}
              onValueChange={(value) => setFormData({ ...formData, department: value })}
            >
              <SelectTrigger>
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
          <div className="space-y-2">
            <Label htmlFor="category">Primary Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
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

        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="location">Specific Location *</Label>
            <Input
              id="location"
              placeholder="Room 301, OR-2, ICU Bay 5"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="building">Building/Wing</Label>
            <Input
              id="building"
              placeholder="Main Building, East Wing"
              value={formData.building}
              onChange={(e) => setFormData({ ...formData, building: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date of Incident *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">Time of Incident *</Label>
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Detailed Description *</Label>
          <Textarea
            id="description"
            placeholder="Provide a comprehensive description of the incident including sequence of events, contributing factors, and immediate outcomes..."
            className="min-h-[120px]"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>
      </CardContent>
    </Card>
  );
};