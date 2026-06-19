"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TelematicsRow } from "@/types/claim";

interface TelemetryRawDataViewProps {
  records: TelematicsRow[];
}

export function TelemetryRawDataView({ records }: TelemetryRawDataViewProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-4 py-3">
        <CardTitle className="text-[13px] font-medium text-slate-900">
          Raw Data
        </CardTitle>
        <span className="text-[11px] text-muted-foreground">
          {records.length} normalized rows
        </span>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full min-w-[640px] text-left text-[11px]">
            <thead className="sticky top-0 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">Timestamp</th>
                <th className="px-3 py-2 font-medium">Speed</th>
                <th className="px-3 py-2 font-medium">Latitude</th>
                <th className="px-3 py-2 font-medium">Longitude</th>
                <th className="px-3 py-2 font-medium">Acceleration</th>
                <th className="px-3 py-2 font-medium">Heading</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => (
                <tr
                  key={`${record.timestamp}-${index}`}
                  className="border-t border-slate-100 text-slate-700"
                >
                  <td className="px-3 py-1.5 font-mono">{record.timestamp}</td>
                  <td className="px-3 py-1.5">{record.speedMph}</td>
                  <td className="px-3 py-1.5">
                    {record.latitude?.toFixed(5) ?? "—"}
                  </td>
                  <td className="px-3 py-1.5">
                    {record.longitude?.toFixed(5) ?? "—"}
                  </td>
                  <td className="px-3 py-1.5">
                    {record.acceleration?.toFixed(2) ?? "—"}
                  </td>
                  <td className="px-3 py-1.5">
                    {record.heading !== undefined
                      ? Math.round(record.heading)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
