import { z } from "zod";

export const BlueprintTableFieldSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
});

export const BlueprintTableSchema = z.object({
  name: z.string().min(1),
  fields: z.array(BlueprintTableFieldSchema),
});

export const BlueprintPageSectionSchema = z.object({
  type: z.string().min(1),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  cta_text: z.string().optional(),
  fields: z.array(z.string()).optional(),
  table: z.string().optional(),
  tables: z.array(z.string()).optional(),
});

export const BlueprintPageSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1), // e.g. "landing" | "form" | "dashboard"
  table: z.string().optional(),
  tables: z.array(z.string()).optional(),
  sections: z.array(BlueprintPageSectionSchema).default([]),
});

export const BlueprintSchema = z.object({
  project_name: z.string().min(1),
  description: z.string().min(1),
  template: z.string().optional(),
  modules: z.array(z.string()).optional(),
  tables: z.array(BlueprintTableSchema),
  features: z.array(z.string()),
  pages: z.array(z.union([BlueprintPageSchema, z.string()])),
  roles: z.array(z.string()),
  ui_blocks: z.array(z.string()),
});

export type Blueprint = z.infer<typeof BlueprintSchema>;

export type BlueprintPage = z.infer<typeof BlueprintPageSchema>;
export type BlueprintPageSection = z.infer<typeof BlueprintPageSectionSchema>;

