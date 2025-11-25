"use client"

import React, { useEffect, useState } from "react"
import { UseFormReturn } from "react-hook-form"
import { Card, CardContent } from "@mtk/ui"
import { GripVertical } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { TournamentFormData } from "../tournament-wizard"
import { useLanguage } from "@/hooks/use-language"

interface StepSeedingProps {
  form: UseFormReturn<TournamentFormData>
}

function SortableTeamItem({
  id,
  name,
}: {
  id: string
  name: string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-card border rounded-lg cursor-grab active:cursor-grabbing"
    >
      <div {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="font-medium">{name}</p>
      </div>
      <div className="text-sm text-muted-foreground">#{id}</div>
    </div>
  )
}

export function StepSeeding({ form }: StepSeedingProps) {
  const { t } = useLanguage()
  const maxTeams = form.watch("maxTeams")
  const format = form.watch("format")

  // Generate placeholder teams
  const generateTeams = () => {
    const teams = form.watch("teamSeeding") || []
    if (teams.length === 0) {
      return Array.from({ length: maxTeams }, (_, i) => ({
        id: `team-${i + 1}`,
        name: `Team ${i + 1}`,
      }))
    }
    return teams.map((id, index) => ({
      id,
      name: `Team ${index + 1}`,
    }))
  }

  const [teams, setTeams] = useState(generateTeams())

  useEffect(() => {
    setTeams(generateTeams())
  }, [maxTeams])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setTeams((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        form.setValue(
          "teamSeeding",
          newItems.map((item) => item.id)
        )
        return newItems
      })
    }
  }

  // Only show seeding for knockout and hybrid formats
  if (format === "league") {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {t("seedingNotRequired") ||
            "Team seeding is not required for league format"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t("teamSeeding")}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {t("dragToReorder")}
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={teams.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {teams.map((team) => (
                  <SortableTeamItem key={team.id} id={team.id} name={team.name} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>
    </div>
  )
}

