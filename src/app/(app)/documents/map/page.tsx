"use client";

import { Download, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export default function MapPage() {
  return (
    <>
      <PageHeader title="ISB Campus Map" showBack />

      <div className="flex flex-col h-[calc(100dvh-3.5rem-3.5rem)]">
        {/* Action bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-white">
          <p className="text-xs text-muted">
            Pinch to zoom &middot; Scroll to explore
          </p>
          <div className="flex gap-2">
            <a
              href="/campus-map.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-medium text-foreground active:bg-gray-100"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </a>
            <a
              href="/campus-map.pdf"
              download="ISB_Campus_Map.pdf"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-primary-500 bg-primary-500 px-3 text-xs font-medium text-white active:bg-primary-600"
            >
              <Download className="h-3.5 w-3.5" />
              Save
            </a>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 bg-gray-100">
          <embed
            src="/campus-map.pdf"
            type="application/pdf"
            className="h-full w-full"
            title="ISB Hyderabad Campus Map"
          />
        </div>
      </div>
    </>
  );
}
