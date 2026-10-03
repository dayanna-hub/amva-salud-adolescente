"use client";

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

type TrendChartProps = {
  data: { month: number; morbidity: number; mortality: number }[];
};

const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function TrendChart({ data }: TrendChartProps) {
  const morbidity = data.map((d) => d.morbidity);
  const mortality = data.map((d) => d.mortality);

  const option: EChartsOption = {
    grid: {
      top: 30,
      left: 8,
      right: 16,
      bottom: 8,
      containLabel: true,
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(15, 23, 42, 0.92)",
      borderColor: "transparent",
      borderRadius: 12,
      padding: [10, 14],
      textStyle: {
        color: "#f8fafc",
        fontSize: 12,
        fontFamily: "Inter, system-ui, sans-serif",
      },
      axisPointer: {
        type: "line",
        lineStyle: {
          color: "#94a3b8",
          type: "dashed",
          width: 1,
        },
      },
      formatter: (params: unknown) => {
        const arr = params as Array<{ axisValue: string; seriesName: string; value: number; color: string }>;
        if (!Array.isArray(arr)) return "";
        const title = arr[0]?.axisValue ?? "";
        const rows = arr
          .map((p) => {
            return `<div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:${p.color}"></span>
              <span style="color:#cbd5e1">${p.seriesName}</span>
              <span style="margin-left:auto;font-weight:600;color:#fff">${p.value.toLocaleString("es-CO")}</span>
            </div>`;
          })
          .join("");
        return `<div style="font-weight:600;color:#fff;font-size:11px;text-transform:uppercase;letter-spacing:0.06em">${title}</div>${rows}`;
      },
    },
    legend: {
      show: true,
      top: 0,
      right: 0,
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 12,
      textStyle: {
        color: "#64748b",
        fontSize: 12,
        fontFamily: "Inter, system-ui, sans-serif",
      },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: months,
      axisLine: { lineStyle: { color: "#e2e8f0" } },
      axisTick: { show: false },
      axisLabel: {
        color: "#94a3b8",
        fontSize: 11,
        fontFamily: "Inter, system-ui, sans-serif",
      },
    },
    yAxis: {
      type: "value",
      splitLine: {
        lineStyle: {
          color: "#f1f5f9",
          type: "solid",
        },
      },
      axisLabel: {
        color: "#94a3b8",
        fontSize: 11,
        fontFamily: "Inter, system-ui, sans-serif",
      },
    },
    series: [
      {
        name: "Morbilidad",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        showSymbol: false,
        data: morbidity,
        lineStyle: {
          width: 2.5,
          color: "#0d9488",
        },
        itemStyle: {
          color: "#0d9488",
          borderColor: "#fff",
          borderWidth: 2,
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(13, 148, 136, 0.25)" },
              { offset: 1, color: "rgba(13, 148, 136, 0.0)" },
            ],
          },
        },
        emphasis: {
          focus: "series",
          scale: 1.4,
        },
      },
      {
        name: "Mortalidad",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        showSymbol: false,
        data: mortality,
        lineStyle: {
          width: 2.5,
          color: "#e11d48",
        },
        itemStyle: {
          color: "#e11d48",
          borderColor: "#fff",
          borderWidth: 2,
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(225, 29, 72, 0.20)" },
              { offset: 1, color: "rgba(225, 29, 72, 0.0)" },
            ],
          },
        },
        emphasis: {
          focus: "series",
          scale: 1.4,
        },
      },
    ],
  };

  return (
    <div className="h-[280px] w-full">
      <ReactECharts
        option={option}
        style={{ height: "100%", width: "100%" }}
        opts={{ renderer: "svg" }}
        notMerge={true}
      />
    </div>
  );
}
