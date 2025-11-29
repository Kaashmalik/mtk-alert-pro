"use client"
/* eslint-disable @next/next/no-img-element */

import { UseFormReturn } from "react-hook-form"
import { Card, CardContent, Input, Label } from "@mtk/ui"
import { Image as ImageIcon } from "lucide-react"
import { TournamentFormData } from "../tournament-wizard"
import { useLanguage } from "@/hooks/use-language"
import { useState } from "react"

interface StepBrandingProps {
  form: UseFormReturn<TournamentFormData>
}

export function StepBranding({ form }: StepBrandingProps) {
  const { t } = useLanguage()
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setLogoPreview(result)
        form.setValue("logo", result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t("branding")}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {t("brandingDescription") || "Customize your tournament appearance"}
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="logo">{t("uploadLogo")}</Label>
                <div className="mt-2">
                  <input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <label htmlFor="logo">
                    <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="max-h-32 mx-auto"
                        />
                      ) : (
                        <div className="space-y-2">
                          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload logo
                          </p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="primaryColor">{t("primaryColor")}</Label>
                <div className="mt-2 flex items-center gap-4">
                  <Input
                    id="primaryColor"
                    type="color"
                    {...form.register("primaryColor")}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={form.watch("primaryColor") || "#10b981"}
                    onChange={(e) => form.setValue("primaryColor", e.target.value)}
                    placeholder="#10b981"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Preview</h3>
            <div
              className="rounded-lg p-6 text-white"
              style={{
                backgroundColor: form.watch("primaryColor") || "#10b981",
              }}
            >
              {logoPreview && (
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="h-16 mb-4"
                />
              )}
              <h4 className="text-2xl font-bold">
                {form.watch("name") || "Tournament Name"}
              </h4>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

