import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  rightBubble?: string; // bg/text/border classes
};

export default function StatCard({ title, value, description, icon: Icon, rightBubble = "bg-[#e8f1ff] text-[#1E60D6] border-[#d6e5ff]" }: Props) {
  return (
    <Card className="bg-white rounded-[12px] border border-[hsl(var(--border))] shadow-[0_1px_1px_rgba(0,0,0,0.02)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <p className="text-[14px] font-medium text-[hsl(var(--muted-foreground))]">{title}</p>
          <div className={`h-[38px] w-[38px] rounded-full border inline-flex items-center justify-center ${rightBubble}`}>
            <Icon className="h-[18px] w-[18px]" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-[28px] leading-8 font-semibold text-[hsl(var(--foreground))]">{value}</p>
          {description && <p className="text-[12px] text-[hsl(var(--muted-foreground))] mt-1">{description}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
