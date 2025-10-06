import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Bell, Shield, Users, Database } from "lucide-react";

import "./style.css";

const Settings = () => {
  return (
    <div className="settings-v2 !min-h-screen !bg-background">
      <div className="!max-w-[80%] !mx-auto !p-6 !space-y-6">
        {/* Header */}
        <div className="!mb-4">
          <h1 className="!text-[22px] !font-extrabold !tracking-[-0.01em] !text-foreground !flex !items-center">
            <SettingsIcon className="!h-[18px] !w-[18px] !mr-2 !text-[#1E60D6]" />
            System Settings
          </h1>
          <p className="!text-[13px] !mt-1 !text-muted-foreground">
            Configure system preferences and administrative settings
          </p>
        </div>

        {/* General Settings */}
        <Card className="!rounded-[12px] !border !border-[#E6EBF1] !shadow-sm">
          <CardHeader className="!py-3 !px-4 !border-b !border-[#E6EBF1]">
            <CardTitle className="!text-[15px] !font-semibold !text-foreground !flex !items-center">
              <Database className="!h-[16px] !w-[16px] !mr-2 !text-[#1E60D6]" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="!space-y-4 !p-4">
            <div className="!grid !gap-4 md:!grid-cols-2">
              <div className="!space-y-2">
                <Label htmlFor="hospitalName" className="!text-[12px] !font-medium">Hospital Name</Label>
                <Input id="hospitalName" defaultValue="MedCare General Hospital" className="sys-field" />
              </div>
              <div className="!space-y-2">
                <Label htmlFor="adminEmail" className="!text-[12px] !font-medium">Administrator Email</Label>
                <Input id="adminEmail" type="email" defaultValue="admin@medcare.hospital" className="sys-field" />
              </div>
            </div>

            <div className="!grid !gap-4 md:!grid-cols-2">
              <div className="!space-y-2">
                <Label className="!text-[12px] !font-medium">Timezone</Label>
                <Select defaultValue="est">
                  <SelectTrigger className="sys-select">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="est">Eastern Time (EST)</SelectItem>
                    <SelectItem value="cst">Central Time (CST)</SelectItem>
                    <SelectItem value="mst">Mountain Time (MST)</SelectItem>
                    <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="!space-y-2">
                <Label className="!text-[12px] !font-medium">Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger className="sys-select">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="!rounded-[12px] !border !border-[#E6EBF1] !shadow-sm">
          <CardHeader className="!py-3 !px-4 !border-b !border-[#E6EBF1]">
            <CardTitle className="!text-[15px] !font-semibold !text-foreground !flex !items-center">
              <Bell className="!h-[16px] !w-[16px] !mr-2 !text-[#1E60D6]" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="!p-0">
            <div className="!flex !items-center !justify-between !px-4 !py-4">
              <div className="!space-y-0.5">
                <Label className="!text-[13px]">Email Notifications</Label>
                <p className="!text-[12px] !text-muted-foreground">Receive email alerts for critical incidents</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="shad-separator" />
            <div className="!flex !items-center !justify-between !px-4 !py-4">
              <div className="!space-y-0.5">
                <Label className="!text-[13px]">SMS Alerts</Label>
                <p className="!text-[12px] !text-muted-foreground">Send SMS for high-priority incidents</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="shad-separator" />
            <div className="!flex !items-center !justify-between !px-4 !py-4">
              <div className="!space-y-0.5">
                <Label className="!text-[13px]">Dashboard Notifications</Label>
                <p className="!text-[12px] !text-muted-foreground">Show real-time notifications in dashboard</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security & Privacy */}
        <Card className="!rounded-[12px] !border !border-[#E6EBF1] !shadow-sm">
          <CardHeader className="!py-3 !px-4 !border-b !border-[#E6EBF1]">
            <CardTitle className="!text-[15px] !font-semibold !text-foreground !flex !items-center">
              <Shield className="!h-[16px] !w-[16px] !mr-2 !text-[#1E60D6]" />
              Security & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="!p-0">
            <div className="!flex !items-center !justify-between !px-4 !py-4">
              <div className="!space-y-0.5">
                <Label className="!text-[13px]">Two-Factor Authentication</Label>
                <p className="!text-[12px] !text-muted-foreground">Require 2FA for all administrative actions</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="shad-separator" />
            <div className="!flex !items-center !justify-between !px-4 !py-4">
              <div className="!space-y-0.5">
                <Label className="!text-[13px]">Auto-logout</Label>
                <p className="!text-[12px] !text-muted-foreground">Automatically logout after 30 minutes of inactivity</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator className="shad-separator" />
            <div className="!flex !items-center !justify-between !px-4 !py-4">
              <div className="!space-y-0.5">
                <Label className="!text-[13px]">Data Encryption</Label>
                <p className="!text-[12px] !text-muted-foreground">Encrypt all incident data at rest</p>
              </div>
              <Switch defaultChecked disabled />
            </div>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="!rounded-[12px] !border !border-[#E6EBF1] !shadow-sm">
          <CardHeader className="!py-3 !px-4 !border-b !border-[#E6EBF1]">
            <CardTitle className="!text-[15px] !font-semibold !text-foreground !flex !items-center">
              <Users className="!h-[16px] !w-[16px] !mr-2 !text-[#1E60D6]" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent className="!space-y-4 !p-4">
            <div className="!grid !gap-4 md:!grid-cols-2">
              <div className="!space-y-2">
                <Label htmlFor="defaultRole" className="!text-[12px] !font-medium">Default User Role</Label>
                <Select defaultValue="staff">
                  <SelectTrigger id="defaultRole" className="sys-select">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="nurse">Nurse</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="!space-y-2">
                <Label htmlFor="sessionTimeout" className="!text-[12px] !font-medium">Session Timeout (minutes)</Label>
                <Input id="sessionTimeout" type="number" defaultValue="30" className="sys-field" />
              </div>
            </div>

            <div className="!flex !items-center !justify-between">
              <div className="!space-y-0.5">
                <Label className="!text-[13px]">Allow Anonymous Reporting</Label>
                <p className="!text-[12px] !text-muted-foreground">
                  Allow incidents to be reported without user identification
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="!flex !justify-end !pt-2">
          <Button
            size="lg"
            className="!h-9 !px-6 !rounded-[8px] !bg-[#0B66FF] hover:!bg-[#0957d9] !text-white !shadow-sm"
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
