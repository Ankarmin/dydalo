"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { formatPrice } from "@/lib/utils/format";

interface RevenueChartProps {
  data: { label: string; revenue: number }[];
}

const chartConfig = {
  revenue: {
    label: "Ingresos",
    color: "var(--chart-1)",
  },
} as const;

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          className="[&_line]:stroke-border/40"
        />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          tickMargin={8}
          className="[&_text]:fill-muted-foreground"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => formatPrice(v)}
          tickMargin={8}
          className="[&_text]:fill-muted-foreground"
        />
        <Tooltip
          content={
            <ChartTooltipContent
              formatter={(value) => formatPrice(Number(value))}
            />
          }
          cursor={{ fill: "oklch(from var(--muted-foreground) l c h / 0.08)" }}
        />
        <Bar
          dataKey="revenue"
          fill="var(--color-revenue)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
