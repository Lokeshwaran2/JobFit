/**
 * Supported Resume Template Identifiers (Task 10)
 */
export type TemplateId = "classic" | "modern" | "minimal";

export const DEFAULT_TEMPLATE_ID: TemplateId = "classic";

export const VALID_TEMPLATE_IDS: readonly TemplateId[] = ["classic", "modern", "minimal"] as const;

export interface TemplateConfig {
  id: TemplateId;
  name: string;
  description: string;
  badge: string;
  pdfStyles: {
    pagePadding: number;
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    mutedColor: string;
    headingBorderBottom: string;
    headingFontSize: number;
    nameFontSize: number;
    bodyFontSize: number;
    lineHeight: number;
    jobBlockMarginBottom: number;
    sectionMarginTop: number;
    headerAlignment: "left" | "center";
  };
  docxStyles: {
    font: string;
    primaryColor: string; // Hex color for headings
    secondaryColor: string;
    textColor: string;
    mutedColor: string;
    headingSize: number; // in half-points (e.g. 24 = 12pt)
    nameSize: number; // in half-points (e.g. 40 = 20pt)
    bodySize: number; // in half-points (e.g. 20 = 10pt)
    margins: {
      top: number; // in twips (1440 = 1 inch)
      right: number;
      bottom: number;
      left: number;
    };
    hasHeadingBorder: boolean;
    headerAlignment: "left" | "center";
  };
}

export const CLASSIC_TEMPLATE: TemplateConfig = {
  id: "classic",
  name: "Classic",
  description: "Professional, conservative, highly readable ATS-standard layout with traditional section hierarchy.",
  badge: "Recommended",
  pdfStyles: {
    pagePadding: 32,
    primaryColor: "#000000",
    secondaryColor: "#333333",
    textColor: "#111111",
    mutedColor: "#555555",
    headingBorderBottom: "1pt solid #000000",
    headingFontSize: 11,
    nameFontSize: 19,
    bodyFontSize: 9.5,
    lineHeight: 1.45,
    jobBlockMarginBottom: 8,
    sectionMarginTop: 9,
    headerAlignment: "left",
  },
  docxStyles: {
    font: "Calibri",
    primaryColor: "000000",
    secondaryColor: "333333",
    textColor: "111111",
    mutedColor: "555555",
    headingSize: 22, // 11pt
    nameSize: 38, // 19pt
    bodySize: 20, // 10pt
    margins: {
      top: 1080, // 0.75 in
      right: 1080,
      bottom: 1080,
      left: 1080,
    },
    hasHeadingBorder: true,
    headerAlignment: "left",
  },
};

export const MODERN_TEMPLATE: TemplateConfig = {
  id: "modern",
  name: "Modern",
  description: "Contemporary visual hierarchy with a refined slate-blue accent, clean dividers, and sharp typography.",
  badge: "Popular",
  pdfStyles: {
    pagePadding: 30,
    primaryColor: "#1E3A8A", // Deep Slate Blue
    secondaryColor: "#1E40AF",
    textColor: "#1E293B",
    mutedColor: "#64748B",
    headingBorderBottom: "1.5pt solid #1E3A8A",
    headingFontSize: 11.5,
    nameFontSize: 20,
    bodyFontSize: 9.5,
    lineHeight: 1.45,
    jobBlockMarginBottom: 8,
    sectionMarginTop: 10,
    headerAlignment: "left",
  },
  docxStyles: {
    font: "Arial",
    primaryColor: "1E3A8A", // Deep Slate Blue
    secondaryColor: "1E40AF",
    textColor: "1E293B",
    mutedColor: "64748B",
    headingSize: 24, // 12pt
    nameSize: 40, // 20pt
    bodySize: 20, // 10pt
    margins: {
      top: 1000,
      right: 1000,
      bottom: 1000,
      left: 1000,
    },
    hasHeadingBorder: true,
    headerAlignment: "left",
  },
};

export const MINIMAL_TEMPLATE: TemplateConfig = {
  id: "minimal",
  name: "Minimal",
  description: "Clean, compact typography-focused design with light gray dividers and maximum content clarity.",
  badge: "Clean",
  pdfStyles: {
    pagePadding: 28,
    primaryColor: "#18181B",
    secondaryColor: "#3F3F46",
    textColor: "#27272A",
    mutedColor: "#71717A",
    headingBorderBottom: "0.75pt solid #E4E4E7",
    headingFontSize: 10.5,
    nameFontSize: 18,
    bodyFontSize: 9,
    lineHeight: 1.4,
    jobBlockMarginBottom: 7,
    sectionMarginTop: 8,
    headerAlignment: "left",
  },
  docxStyles: {
    font: "Segoe UI",
    primaryColor: "18181B",
    secondaryColor: "3F3F46",
    textColor: "27272A",
    mutedColor: "71717A",
    headingSize: 22, // 11pt
    nameSize: 36, // 18pt
    bodySize: 19, // 9.5pt
    margins: {
      top: 900,
      right: 900,
      bottom: 900,
      left: 900,
    },
    hasHeadingBorder: true,
    headerAlignment: "left",
  },
};

export const TEMPLATE_REGISTRY: Record<TemplateId, TemplateConfig> = {
  classic: CLASSIC_TEMPLATE,
  modern: MODERN_TEMPLATE,
  minimal: MINIMAL_TEMPLATE,
};

/**
 * Checks if a given string is a valid TemplateId
 */
export function isValidTemplateId(id: any): id is TemplateId {
  return typeof id === "string" && (VALID_TEMPLATE_IDS as readonly string[]).includes(id);
}

/**
 * Resolves template ID with safe fallback to "classic" for null, undefined, or unknown IDs
 */
export function resolveTemplateId(id?: string | null): TemplateId {
  if (isValidTemplateId(id)) {
    return id;
  }
  return DEFAULT_TEMPLATE_ID;
}

/**
 * Retrieves the full configuration for a template ID
 */
export function getTemplateConfig(id?: string | null): TemplateConfig {
  const resolved = resolveTemplateId(id);
  return TEMPLATE_REGISTRY[resolved];
}

/**
 * Returns all available templates for selection UI
 */
export function getAllTemplates(): TemplateConfig[] {
  return Object.values(TEMPLATE_REGISTRY);
}
