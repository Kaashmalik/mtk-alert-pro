import { BrandingSettings } from "@/components/settings/branding-settings";

export default function BrandingSettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Branding Settings</h1>
        <p className="text-muted-foreground mt-2">
          Customize your league&apos;s appearance, domain, and branding. Enterprise plans include white-label options.
        </p>
      </div>
      <BrandingSettings />
    </div>
  );
}

