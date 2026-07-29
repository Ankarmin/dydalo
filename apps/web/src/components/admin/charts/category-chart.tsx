"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { formatPrice } from "@/lib/utils/format";

interface CategoryChartProps {
  data: { category: string; units: number; revenue: number }[];
  dataKey?: "units" | "revenue";
}

const chartConfig = {
  revenue: {
    label: "Ingresos",
    color: "var(--chart-1)",
  },
  units: {
    label: "Unidades",
    color: "var(--chart-2)",
  },
} as const;

export function CategoryChart({ data, dataKey = "revenue" }: CategoryChartProps) {
  const key = dataKey as string;

  return (
    <ChartContainer config={chartConfig} className="h-[280px] w-full">
      <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          className="[&_line]:stroke-border/40"
        />
        <XAxis
          dataKey="category"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => String(v).charAt(0).toUpperCase() + String(v).slice(1)}
          tickMargin={8}
          className="[&_text]:fill-muted-foreground"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          tickFormatter={dataKey === "revenue" ? (v) => formatPrice(v) : undefined}
          tickMargin={8}
          className="[&_text]:fill-muted-foreground"
        />
        <Tooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) =>
                String(label).charAt(0).toUpperCase() + String(label).slice(1)
              }
              formatter={
                dataKey === "revenue"
                  ? (value) => formatPrice(Number(value))
                  : undefined
              }
            />
          }
          cursor={{ fill: "oklch(from var(--muted-foreground) l c h / 0.08)" }}
        />
        <Bar
          dataKey={key}
          fill={`var(--color-${key})`}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
