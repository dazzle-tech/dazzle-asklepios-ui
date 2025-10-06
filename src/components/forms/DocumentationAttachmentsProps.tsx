import { FormData } from "@/types/incident";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Upload, Camera, Video, FileImage, Trash2 } from "lucide-react";
import React, { useState } from "react";

interface DocumentationAttachmentsProps {
  formData: FormData;
  setFormData: (data: FormData) => void;
}

export const DocumentationAttachments = ({
  formData,
  setFormData,
}: DocumentationAttachmentsProps) => {
  const [attachments, setAttachments] = useState<string[]>([]);

  const addAttachment = (type: string) => {
    const newAttachment = `${type}_${Date.now()}.${
      type === "photo" ? "jpg" : type === "video" ? "mp4" : "pdf"
    }`;
    setAttachments((prev) => [...prev, newAttachment]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };


  const tileClass =
    "!h-[92px] !rounded-[12px] !border !border-[#E6EBF1] !bg-[#F7F8FA] " +
    "!flex !flex-col !items-center !justify-center !text-center " +
    "hover:!bg-[#F3F5F9] active:!bg-[#EEF2F7] !transition-colors";


  const checkboxBlue =
    "!h-[16px] !w-[16px] !rounded-[4px] " +
    "!border-2 !border-[#1E60D6] " +
    "data-[state=checked]:bg-[#1E60D6] data-[state=checked]:text-white";

  return (
    <Card className="!rounded-[12px] !border !border-[#E6EBF1] !shadow-sm">
      <CardHeader className="!py-4 !px-6 !border-b !border-[#E6EBF1]">
        <CardTitle className="!text-[17px] !font-semibold !text-[hsl(var(--foreground))] !flex !items-center">
          <FileText className="!h-[18px] !w-[18px] !mr-2 !text-[#1E60D6]" />
          Documentation & Evidence
        </CardTitle>
      </CardHeader>

      <CardContent className="!px-6 !pt-5 !pb-6 !space-y-6">
        {/* Witness Information */}
        <section className="!space-y-3">
          <Label className="!text-[14px] !font-medium">Witness Information</Label>
          <div className="!pl-5">
            <label htmlFor="witnessPresent" className="!text-[14px] !inline-flex !items-center !gap-2">
              <Checkbox
                id="witnessPresent"
                checked={formData.witnessPresent}
                onCheckedChange={(v) =>
                  setFormData({ ...formData, witnessPresent: !!v })
                }
                className={checkboxBlue}
              />
              Witnesses were present during the incident
            </label>
          </div>
        </section>

        {/* Attach Supporting Documentation */}
        <section className="!space-y-3">
          <Label className="!text-[14px] !font-medium">
            Attach Supporting Documentation
          </Label>

          <div className="!grid !grid-cols-4 !gap-5">
            <Button type="button" variant="outline" className={tileClass} onClick={() => addAttachment("photo")}>
              <Camera className="!h-[18px] !w-[18px] !mb-1 !text-[#1F2937]" />
              <span className="!text-[12px] !font-medium">Photos</span>
            </Button>

            <Button type="button" variant="outline" className={tileClass} onClick={() => addAttachment("video")}>
              <Video className="!h-[18px] !w-[18px] !mb-1 !text-[#1F2937]" />
              <span className="!text-[12px] !font-medium">Videos</span>
            </Button>

            <Button type="button" variant="outline" className={tileClass} onClick={() => addAttachment("document")}>
              <FileText className="!h-[18px] !w-[18px] !mb-1 !text-[#1F2937]" />
              <span className="!text-[12px] !font-medium">Documents</span>
            </Button>

            <Button type="button" variant="outline" className={tileClass} onClick={() => addAttachment("report")}>
              <Upload className="!h-[18px] !w-[18px] !mb-1 !text-[#1F2937]" />
              <span className="!text-[12px] !font-medium">Reports</span>
            </Button>
          </div>
        </section>

        {attachments.length > 0 && (
          <section className="!space-y-3">
            <Label className="!text-[14px] !font-medium">Attached Files</Label>
            <div className="!space-y-2.5">
              {attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="!flex !items-center !justify-between !p-2.5 !rounded-[10px] !border !border-[#E6EBF1] !bg-[#F7F8FA]"
                >
                  <div className="!flex !items-center !space-x-2.5">
                    <FileImage className="!h-[16px] !w-[16px] !text-[hsl(var(--muted-foreground))]" />
                    <span className="!text-[13px]">{attachment}</span>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeAttachment(index)} className="!h-8 !px-2">
                    <Trash2 className="!h-4 !w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Equipment */}
        <section className="!space-y-2.5">
          <Label className="!text-[14px] !font-medium">Equipment/Technology Involved</Label>
          <Textarea
            placeholder="List all equipment, devices, or technology involved in the incident. Include model numbers, serial numbers, and maintenance status..."
            value={formData.equipmentInvolved}
            onChange={(e) =>
              setFormData({ ...formData, equipmentInvolved: e.target.value })
            }
            className="!min-h-[104px] !text-[14px]"
          />
        </section>

        {/* Medications */}
        <section className="!space-y-2.5">
          <Label className="!text-[14px] !font-medium">Medications Involved</Label>
          <Textarea
            placeholder="List all medications involved, including dosages, routes, and timing. Include any look-alike/sound-alike medications..."
            value={formData.medicationsInvolved}
            onChange={(e) =>
              setFormData({ ...formData, medicationsInvolved: e.target.value })
            }
            className="!min-h-[104px] !text-[14px]"
          />
        </section>

        {/* Toggles */}
        <section className="!grid md:!grid-cols-2 !gap-x-6 !gap-y-3">
          <label htmlFor="policeCalled" className="!text-[14px] !inline-flex !items-center !gap-2">
            <Checkbox
              id="policeCalled"
              checked={formData.policeCalled}
              onCheckedChange={(v) =>
                setFormData({ ...formData, policeCalled: !!v })
              }
              className={checkboxBlue}
            />
            Police/Security called
          </label>

          <label htmlFor="mediaInvolved" className="!text-[14px] !inline-flex !items-center !gap-2">
            <Checkbox
              id="mediaInvolved"
              checked={formData.mediaInvolved}
              onCheckedChange={(v) =>
                setFormData({ ...formData, mediaInvolved: !!v })
              }
              className={checkboxBlue}
            />
            Media attention potential
          </label>
        </section>
      </CardContent>
    </Card>
  );
};
