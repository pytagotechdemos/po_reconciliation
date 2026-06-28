"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { Input } from "./Input";
import { Search as SearchIcon } from "lucide-react";

export function Search() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isPending, startTransition] = useTransition();
  const [term, setTerm] = useState(searchParams.get("q")?.toString() || "");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      params.set("page", "1");
      if (term) {
        params.set("q", term);
      } else {
        params.delete("q");
      }
      startTransition(() => {
        replace(`${pathname}?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [term, pathname, replace, searchParams]);

  return (
    <div className="relative w-full max-w-sm">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <SearchIcon className="h-4 w-4 text-slate-400" />
      </div>
      <Input
        type="search"
        placeholder="Cari PO atau Supplier..."
        className="pl-10"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      {isPending && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <div className="h-4 w-4 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
