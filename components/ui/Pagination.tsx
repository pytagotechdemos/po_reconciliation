"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "./Button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ totalPages }: { totalPages: number }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const currentPage = Number(searchParams.get("page")) || 1;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => replace(createPageURL(currentPage - 1))}
      >
        <ChevronLeft className="h-4 w-4 mr-1" /> Prev
      </Button>
      <div className="text-sm text-slate-600 font-medium px-2">
        Page {currentPage} of {totalPages}
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => replace(createPageURL(currentPage + 1))}
      >
        Next <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
