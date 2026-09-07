"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export function JobTrackerControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "ALL";
  const currentSearch = searchParams.get("search") || "";
  const currentSort = searchParams.get("sort") || "recent_updated";

  const [searchTerm, setSearchTerm] = React.useState(currentSearch);

  // Debounced search update
  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "" || (key === "status" && value === "ALL")) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({ search: searchTerm.trim() });
  };

  const clearSearch = () => {
    setSearchTerm("");
    updateQuery({ search: null });
  };

  const filterTabs = [
    { label: "All", value: "ALL" },
    { label: "Saved", value: "SAVED" },
    { label: "Applied", value: "APPLIED" },
    { label: "Interview", value: "INTERVIEW" },
    { label: "Offer", value: "OFFER" },
    { label: "Rejected", value: "REJECTED" },
  ];

  return (
    <div className="space-y-4">
      {/* Search Bar & Sorting */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by role, company, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-8 h-9 text-sm"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Sort by:</span>
          <select
            value={currentSort}
            onChange={(e) => updateQuery({ sort: e.target.value })}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          >
            <option value="recent_updated">Recently Updated</option>
            <option value="recent_saved">Recently Saved</option>
            <option value="applied_date">Applied Date</option>
            <option value="match_score">Job Match Score</option>
          </select>
        </div>
      </div>

      {/* Status Filter Badges */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {filterTabs.map((tab) => {
          const isActive = currentStatus === tab.value;
          return (
            <Button
              key={tab.value}
              type="button"
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => updateQuery({ status: tab.value })}
              className={`h-7 px-3 text-xs font-medium rounded-full ${
                isActive ? "shadow-sm font-semibold" : "border-slate-200 dark:border-slate-800 text-muted-foreground"
              }`}
            >
              {tab.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
