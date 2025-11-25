"use client"

import { UseFormReturn } from "react-hook-form"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table"
import { Card, CardContent, CardHeader, CardTitle } from "@mtk/ui"
import { TournamentFormData } from "./tournament-wizard"

interface PointsTablePreviewProps {
  form: UseFormReturn<TournamentFormData>
}

type TeamRow = {
  team: string
  played: number
  won: number
  lost: number
  tied: number
  points: number
  nrr: string
}

const columnHelper = createColumnHelper<TeamRow>()

const columns = [
  columnHelper.accessor("team", {
    header: "Team",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("played", {
    header: "P",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("won", {
    header: "W",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("lost", {
    header: "L",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("tied", {
    header: "T",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("points", {
    header: "Pts",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("nrr", {
    header: "NRR",
    cell: (info) => info.getValue(),
  }),
]

export function PointsTablePreview({ form }: PointsTablePreviewProps) {
  const maxTeams = form.watch("maxTeams")
  const format = form.watch("format")

  // Generate sample data
  const data: TeamRow[] = Array.from({ length: Math.min(maxTeams, 8) }, (_, i) => ({
    team: `Team ${i + 1}`,
    played: 0,
    won: 0,
    lost: 0,
    tied: 0,
    points: 0,
    nrr: "0.000",
  }))

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (format === "knockout") {
    return null // No points table for knockout
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Points Table Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-left p-2 font-semibold text-sm"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-2 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

