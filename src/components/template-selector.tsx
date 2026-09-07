"use client";

import React from "react";
import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getAllTemplates,
  TemplateId,
} from "@/lib/templates/template-registry";
import { Badge } from "@/components/ui/badge";

interface TemplateSelectorProps {
  selectedTemplate: TemplateId;
  onSelectTemplate: (id: TemplateId) => void;
  disabled?: boolean;
}

export function TemplateSelector({
  selectedTemplate,
  onSelectTemplate,
  disabled = false,
}: TemplateSelectorProps) {
  const templates = getAllTemplates();
  const currentTemplate = templates.find((t) => t.id === selectedTemplate) || templates[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-8 gap-1.5 text-xs font-medium border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <Palette className="h-3.5 w-3.5 text-slate-500" />
          <span className="hidden sm:inline text-muted-foreground">Template:</span>
          <span className="font-semibold text-foreground">{currentTemplate.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-1">
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
          Resume Templates
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {templates.map((tpl) => {
          const isSelected = tpl.id === selectedTemplate;
          return (
            <DropdownMenuItem
              key={tpl.id}
              onClick={() => onSelectTemplate(tpl.id)}
              className="flex items-start justify-between p-2 cursor-pointer rounded-md transition-colors hover:bg-accent"
            >
              <div className="flex flex-col gap-0.5 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-sm text-foreground">{tpl.name}</span>
                  {tpl.badge && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                      {tpl.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">
                  {tpl.description}
                </span>
              </div>
              {isSelected && (
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
