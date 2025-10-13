import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Search, Filter, Eye, Edit } from 'lucide-react';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

const mockIncidents = [
  {
    id: 'INC-2024-001',
    title: 'Medication Administration Error',
    department: 'ICU',
    severity: 'High',
    status: 'Under Review',
    date: '2024-01-15',
    reporter: 'Dr. Sarah Johnson',
    category: 'Medication'
  },
  {
    id: 'INC-2024-002',
    title: 'Patient Fall in Hallway',
    department: 'Emergency',
    severity: 'Medium',
    status: 'Resolved',
    date: '2024-01-14',
    reporter: 'Nurse Maria Garcia',
    category: 'Fall'
  },
  {
    id: 'INC-2024-003',
    title: 'Equipment Malfunction - Ventilator',
    department: 'Surgery',
    severity: 'Critical',
    status: 'Investigation',
    date: '2024-01-14',
    reporter: 'Tech John Smith',
    category: 'Equipment'
  },
  {
    id: 'INC-2024-004',
    title: 'Communication Breakdown',
    department: 'Cardiology',
    severity: 'Low',
    status: 'Resolved',
    date: '2024-01-13',
    reporter: 'Dr. Michael Brown',
    category: 'Communication'
  },
  {
    id: 'INC-2024-005',
    title: 'Infection Control Breach',
    department: 'Laboratory',
    severity: 'High',
    status: 'Action Required',
    date: '2024-01-12',
    reporter: 'Lab Tech Lisa Wilson',
    category: 'Infection'
  }
];

const IncidentList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const filteredIncidents = mockIncidents.filter(incident => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      incident.title.toLowerCase().includes(q) ||
      incident.id.toLowerCase().includes(q) ||
      incident.department.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'all' || incident.status.toLowerCase().replace(/\s/g, '') === statusFilter;

    const matchesSeverity =
      severityFilter === 'all' || incident.severity.toLowerCase() === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  function SeverityBadge({ value }: { value: string }) {
    let color = '';

    if (value === 'Critical') {
      color = '#e42a52ff';
    } else if (value === 'High') {
      color = '#f5c21aff';
    } else if (value === 'Medium') {
      color = '#2e6edeff';
    } else if (value === 'Low') {
      color = '#25f325ff';
    } else {
      color = '#b3b3b3ff';
    }

    return <MyBadgeStatus contant={value} color={color} />;
  }

  function StatusBadge({ value }: { value: string }) {
    let color = '';

    if (value === 'Resolved') {
      color = '#4fdc37ff';
    } else if (value === 'Action Required') {
      color = '#e42a52ff';
    } else if (value === 'Investigation') {
      color = '#2e6edeff';
    } else if (value === 'Under Review') {
      color = '#b3b3b3ff';
    } else {
      color = '#217cecff';
    }

    return <MyBadgeStatus contant={value} color={color} />;
  }

  const Chip = ({
    children,
    className = ''
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <span
      className={`!inline-flex !items-center !rounded-full !px-2.5 !py-1 !text-[11px] !font-semibold ${className}`}
    >
      {children}
    </span>
  );

  return (
    <div className="!min-h-screen !bg-[hsl(var(--background))]">
      <div className="!max-w-7xl !mx-auto !p-6 !space-y-6">
        {/* Header */}
        <div className="!flex !items-center !justify-between">
          <div>
            <h1 className="!text-[28px] !font-bold !leading-8 !text-[hsl(var(--foreground))]">
              Incident Management
            </h1>
            <p className="!text-[13px] !mt-1 !text-[hsl(var(--muted-foreground))]">
              View and manage all reported incidents
            </p>
          </div>
          <Button className="!h-10 !px-4 !rounded-md !bg-[#0B66FF] hover:!bg-[#0957d9] !text-white !shadow-sm">
            <Eye className="!h-4 !w-4 !mr-2" />
            Export Report
          </Button>
        </div>

        {/* Filters */}
        <Card className="!rounded-[12px] !border  !shadow-sm">
          <CardHeader className="!pb-3">
            <CardTitle className="!text-[17px] !font-semibold !text-[hsl(var(--foreground))] !flex !items-center">
              <Filter className="!h-[18px] !w-[18px] !mr-2 !text-[hsl(var(--muted-foreground))]" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="!pt-0">
            <div className="!grid !gap-4 md:!grid-cols-4">
              {/* Search */}
              <div className="!space-y-2">
                <label className="!text-[13px] !font-medium !text-[hsl(var(--foreground))]">
                  Search
                </label>
                <div className="!relative">
                  <Search className="!absolute !left-3 !top-1/2 !-translate-y-1/2 !h-4 !w-4 !text-[hsl(var(--muted-foreground))]" />
                  <Input
                    placeholder="Search incidents..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="!pl-10 !h-10 !rounded-md !border  focus:!ring-0 focus:!border-[#0B66FF]"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="!space-y-2">
                <label className="!text-[13px] !font-medium !text-[hsl(var(--foreground))]">
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="!h-10 !rounded-md !border  focus:!ring-0 focus:!border-[#0B66FF]">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="underreview">Under Review</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="investigation">Investigation</SelectItem>
                    <SelectItem value="actionrequired">Action Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Severity */}
              <div className="!space-y-2">
                <label className="!text-[13px] !font-medium !text-[hsl(var(--foreground))]">
                  Severity
                </label>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="!h-10 !rounded-md !border  focus:!ring-0 focus:!border-[#0B66FF]">
                    <SelectValue placeholder="All severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Results */}
              <div className="!space-y-2">
                <label className="!text-[13px] !font-medium !text-[hsl(var(--foreground))]">
                  Results
                </label>
                <div className="!text-[13px] !text-[hsl(var(--muted-foreground))] !py-2">
                  {filteredIncidents.length} of {mockIncidents.length} incidents
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="!rounded-[12px] !border  !shadow-sm">
          <CardContent className="!p-0">
            <Table>
              <TableHeader>
                <TableRow className="!h-12 !border-b ">
                  <TableHead className="!w-[160px] !pl-6 !text-[#6B7280] !text-[12px] !font-semibold !whitespace-nowrap">
                    Incident ID
                  </TableHead>
                  <TableHead className="!text-[#6B7280] !text-[12px] !font-semibold !text-center">
                    Title
                  </TableHead>
                  <TableHead className="!w-[150px] !text-[#6B7280] !text-[12px] !font-semibold !whitespace-nowrap !text-center">
                    Department
                  </TableHead>
                  <TableHead className="!w-[150px] !text-[#6B7280] !text-[12px] !font-semibold !text-center">
                    Severity
                  </TableHead>
                  <TableHead className="!w-[150px] !text-[#6B7280] !text-[12px] !font-semibold !text-center">
                    Status
                  </TableHead>
                  <TableHead className="!w-[150px] !text-[#6B7280] !text-[12px] !font-semibold !text-center">
                    Date
                  </TableHead>
                  <TableHead className="!text-[#6B7280] !text-[12px] !font-semibold !text-center">
                    Reporter
                  </TableHead>
                  <TableHead className="!w-[160px] !text-right !text-[#6B7280] !text-[12px] !font-semibold !whitespace-nowrap !pr-6 !text-center">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredIncidents.map(incident => (
                  <TableRow
                    key={incident.id}
                    className="!h-[72px] hover:!bg-[hsl(var(--muted))]/50"
                  >
                    <TableCell className="!font-semibold !text-[#1E60D6] !w-[160px] !pl-6 !break-all !leading-4 hover:!underline">
                      {incident.id}
                    </TableCell>

                    {/* Title + category */}
                    <TableCell>
                      <div>
                        <div className="!font-semibold !text-[hsl(var(--foreground))]">
                          {incident.title}
                        </div>
                        <div className="!text-[12px] !text-[hsl(var(--muted-foreground))]">
                          {incident.category}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="!text-center !text-[hsl(var(--foreground))]">
                      {incident.department}
                    </TableCell>

                    <TableCell>
                      <SeverityBadge value={incident.severity} />
                    </TableCell>

                    <TableCell>
                      <StatusBadge value={incident.status} />
                    </TableCell>

                    <TableCell className="!text-[12px] !text-[hsl(var(--muted-foreground))] !text-center">
                      {incident.date}
                    </TableCell>

                    <TableCell className="!text-[12px] !text-[hsl(var(--muted-foreground))]">
                      {incident.reporter}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="!text-right !pr-6">
                      <div className="!flex !justify-end !space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="!h-8 !w-8 !p-0 !rounded-md"
                          aria-label="View"
                        >
                          <Eye className="!h-4 !w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="!h-8 !w-8 !p-0 !rounded-md"
                          aria-label="Edit"
                        >
                          <Edit className="!h-4 !w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default IncidentList;
