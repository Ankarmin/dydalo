"use client";

import { Pie, PieChart, Cell, Tooltip, Legend } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface StatusDonutChartProps {
  data: { status: string; count: number }[];
}

const chartConfig = {
  pendiente: {
    label: "Pendiente",
    color: "var(--warning)",
  },
  confirmado: {
    label: "Confirmado",
    color: "var(--info)",
  },
  enviado: {
    label: "Enviado",
    color: "var(--purple)",
  },
  entregado: {
    label: "Entregado",
    color: "var(--success)",
  },
  cancelado: {
    label: "Cancelado",
    color: "var(--danger)",
  },
  devuelto: {
    label: "Devuelto",
    color: "var(--orange)",
  },
} as const;

export function StatusDonutChart({ data }: StatusDonutChartProps) {
  const pieData = data.map((item) => ({
    name: item.status,
    value: item.count,
    fill: `var(--color-${item.status})`,
  }));

  return (
    <ChartContainer config={chartConfig} className="h-[260px] w-full">
      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={95}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, name) => {
                const label = chartConfig[name as keyof typeof chartConfig]?.label || String(name);
                const count = Number(value);
                const plural = count !== 1;
                const pedido = plural ? "pedidos" : "pedido";
                let statusLabel: string = label;
                if (plural) {
                  if (label === "Pendiente") statusLabel = "pendientes";
                  else if (label === "Devuelto") statusLabel = "devueltos";
                  else statusLabel = label + "s";
                }
                return `${count} ${pedido} ${statusLabel.toLowerCase()}`;
              }}
            />
          }
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => (
            <span className="text-xs capitalize text-muted-foreground">
              {value}
            </span>
          )}
        />
      </PieChart>
    </ChartContainer>
  );
}
