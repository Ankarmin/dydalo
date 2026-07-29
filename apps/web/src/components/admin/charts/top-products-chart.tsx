"use client";

import { Bar, BarChart, XAxis, YAxis, Tooltip } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { formatPrice } from "@/lib/utils/format";

interface TopProductsChartProps {
  data: { name: string; revenue: number; units: number }[];
}

const chartConfig = {
  revenue: {
    label: "Ingresos",
    color: "var(--chart-1)",
  },
} as const;

export function TopProductsChart({ data }: TopProductsChartProps) {
  const sorted = [...data].sort((a, b) => a.revenue - b.revenue);

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart
        data={sorted}
        layout="vertical"
        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
      >
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => formatPrice(v)}
          tickMargin={4}
          className="[&_text]:fill-muted-foreground"
        />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          tickMargin={8}
          width={80}
          className="[&_text]:fill-foreground"
        />
        <Tooltip
          content={
            <ChartTooltipContent
              formatter={(value) => formatPrice(Number(value))}
              labelFormatter={(label) => String(label)}
            />
          }
          cursor={{ fill: "oklch(from var(--muted-foreground) l c h / 0.08)" }}
        />
        <Bar
          dataKey="revenue"
          fill="var(--color-revenue)"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
