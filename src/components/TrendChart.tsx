"use client";

import ReactECharts from "echarts-for-react";

type MonthPoint = { month: number; morbidity: number; mortality: number };

export function TrendChart({ data }: { data: MonthPoint[] }) {
  const labels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const option = {
    tooltip: { trigger: "axis" },
    legend: { data: ["Morbilidad", "Mortalidad"] },
    grid: { left: 45, right: 15, top: 42, bottom: 28 },
    xAxis: { type: "category", data: data.map((x) => labels[x.month - 1]) },
    yAxis: { type: "value", minInterval: 1 },
    series: [
      { name: "Morbilidad", type: "line", smooth: true, data: data.map((x) => x.morbidity) },
      { name: "Mortalidad", type: "line", smooth: true, data: data.map((x) => x.mortality) },
    ],
  };
  return <ReactECharts option={option} style={{ height: 310 }} />;
}
