import { ArrowDown, ArrowUp, PhoneCall } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCalls } from "@/hooks/use-calls";
import { formatMmSs } from "@/lib/duration";
import { formatDateTime } from "@/lib/leads-format";

const PAGE_SIZE = 20;

export default function CallsPage() {
  const [sp, setSp] = useSearchParams();
  const page = Number(sp.get("page") ?? 1);
  const ordering = sp.get("ordering") ?? "-call_timestamp";

  // Every change goes through the URL. Changing a filter resets to page 1.
  function setParam(changes: Record<string, string | null>, resetPage = true) {
    const next = new URLSearchParams(sp);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (resetPage) next.delete("page");
    setSp(next);
  }

  function toggleSort(field: string) {
    setParam({ ordering: ordering === field ? `-${field}` : field });
  }

  const filters = {
    search: sp.get("search") || undefined,
    direction: sp.get("direction") || undefined,
    created_by: sp.get("created_by") ? Number(sp.get("created_by")) : undefined,
    from_date: sp.get("from_date") || undefined,
    to_date: sp.get("to_date") || undefined,
    branch_id: sp.get("branch_id") ? Number(sp.get("branch_id")) : undefined,
  };
  const hasFilters = Object.values(filters).some((v) => v !== undefined);

  const { data, isLoading, isError, refetch } = useCalls({
    ...filters,
    page,
    page_size: PAGE_SIZE,
    ordering,
  });
  const rows = data?.results ?? [];
  const count = data?.count ?? 0;
  const from = count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, count);

  function SortIcon({ field }: { field: string }) {
    if (ordering === field) return <ArrowUp className="ml-1 inline size-3" />;
    if (ordering === `-${field}`) return <ArrowDown className="ml-1 inline size-3" />;
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-brand font-mono text-[11px] font-bold tracking-wider uppercase">CRM Workspace</p>
        <h1 className="font-headline mt-1 text-3xl font-semibold tracking-tight">Calls</h1>
      </div>

      <div className="bg-card overflow-hidden rounded-2xl border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("call_timestamp")}>
                  When <SortIcon field="call_timestamp" />
                </TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Logged by</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("duration_seconds")}>
                  Duration <SortIcon field="duration_seconds" />
                </TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Recording</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {isError && (
                <TableRow>
                  <TableCell colSpan={8} className="py-14 text-center">
                    <p className="text-destructive text-sm">Could not load calls.</p>
                    <Button variant="outline" className="mt-3" onClick={() => refetch()}>
                      Retry
                    </Button>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !isError && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-14 text-center">
                    <PhoneCall className="text-muted-foreground mx-auto size-8 opacity-40" />
                    <p className="text-muted-foreground mt-2 text-sm">
                      {hasFilters ? "No calls match these filters." : "No calls yet."}
                    </p>
                  </TableCell>
                </TableRow>
              )}
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="whitespace-nowrap">{formatDateTime(c.call_timestamp)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {c.direction}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link to={`/leads/${c.lead}`} className="font-semibold hover:underline">
                      {c.lead_name}
                    </Link>
                    <p className="text-muted-foreground font-mono text-xs">{c.lead_reference_number}</p>
                  </TableCell>
                  <TableCell>{c.phone_number}</TableCell>
                  <TableCell>{c.created_by_name || "—"}</TableCell>
                  <TableCell className="tabular-nums">{formatMmSs(c.duration_seconds)}</TableCell>
                  <TableCell className="capitalize">{c.outcome || "—"}</TableCell>
                  <TableCell>
                    {c.recording_url ? (
                      <a href={c.recording_url} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                        Listen
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          Showing {from}–{to} of {count}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setParam({ page: String(page - 1) }, false)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={to >= count}
            onClick={() => setParam({ page: String(page + 1) }, false)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}