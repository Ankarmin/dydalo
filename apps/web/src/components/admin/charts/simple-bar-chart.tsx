"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface SimpleBarChartProps {
  data: { label: string; value: number }[];
  color?: string;
  valueLabel?: string;
  height?: string;
}

const chartConfig = {
  value: {
    label: "Cantidad",
    color: "var(--chart-2)",
  },
};

const MONTH_FULL_SIMPLE: Record<string, string> = {
  Ene: "Enero", Feb: "Febrero", Mar: "Marzo", Abr: "Abril",
  May: "Mayo", Jun: "Junio", Jul: "Julio", Ago: "Agosto",
  Sep: "Septiembre", Oct: "Octubre", Nov: "Noviembre", Dic: "Diciembre",
};

export function SimpleBarChart({
  data,
  color = "var(--chart-2)",
  valueLabel = "Cantidad",
  height = "h-[250px]",
}: SimpleBarChartProps) {
  return (
    <ChartContainer config={chartConfig} className={`${height} w-full`}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="[&_line]:stroke-border/40" />
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
          tickMargin={8}
          className="[&_text]:fill-muted-foreground"
          allowDecimals={false}
        />
        <Tooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => MONTH_FULL_SIMPLE[String(label)] || String(label)}
              formatter={(value) => {
                const n = Number(value);
                const singular = valueLabel.replace(/s$/, "");
                const word = n === 1 ? singular : valueLabel;
                return `${n} ${word.toLowerCase()}`;
              }}
            />
          }
          cursor={{ fill: "oklch(from var(--muted-foreground) l c h / 0.08)" }}
        />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
