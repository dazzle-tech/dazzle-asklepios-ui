import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  rightBubble?: string; // bg/text/border classes
};

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  rightBubble = "bg-[var(--bubble-bg)] text-[var(--bubble-text)] border-[var(--bubble-border)]"
}: Props) {
  return (
    <Card className="bg-[var(--card-bg)] rounded-[12px]  shadow-[0_1px_1px_rgba(0,0,0,0.02)]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <p className="text-[14px] font-medium text-[var(--text-muted)]">{title}</p>
          <div className={`h-[38px] w-[38px] rounded-full border inline-flex items-center justify-center ${rightBubble}`}>
            <Icon className="h-[18px] w-[18px]" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-[28px] leading-8 font-semibold text-[var(--text-primary)]">{value}</p>
          {description && <p className="text-[12px] text-[var(--text-muted)] mt-1">{description}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
