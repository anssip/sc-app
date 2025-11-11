import React, { useState, useMemo } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import type { CompletedTrade } from "~/types/trading";

type SortField = "entryTime" | "exitTime" | "pnl" | "pnlPercent" | "duration";
type SortDirection = "asc" | "desc";

interface Props {
  trades: CompletedTrade[];
  onTradeClick?: (trade: CompletedTrade) => void;
}

/**
 * Sortable table of completed trades
 */
export function TradesList({ trades, onTradeClick }: Props) {
  const [sortField, setSortField] = useState<SortField>("exitTime");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [filter, setFilter] = useState<"all" | "wins" | "losses">("all");

  // Sort and filter trades
  const sortedTrades = useMemo(() => {
    let filtered = trades;

    // Apply filter
    if (filter === "wins") {
      filtered = trades.filter((t) => t.pnl > 0);
    } else if (filter === "losses") {
      filtered = trades.filter((t) => t.pnl <= 0);
    }

    // Apply sort
    return [...filtered].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [trades, sortField, sortDirection, filter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours < 24) {
      return `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  };

  if (trades.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No trades executed
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter Tabs */}
      <div className="flex gap-2 p-3 border-b border-gray-800">
        <FilterButton
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label={`All (${trades.length})`}
        />
        <FilterButton
          active={filter === "wins"}
          onClick={() => setFilter("wins")}
          label={`Wins (${trades.filter((t) => t.pnl > 0).length})`}
          color="text-green-400"
        />
        <FilterButton
          active={filter === "losses"}
          onClick={() => setFilter("losses")}
          label={`Losses (${trades.filter((t) => t.pnl <= 0).length})`}
          color="text-red-400"
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-900">
            <tr className="text-left text-xs text-gray-400">
              <SortHeader
                label="Entry"
                field="entryTime"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
              <SortHeader
                label="Exit"
                field="exitTime"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
              />
              <th className="px-3 py-2">Side</th>
              <th className="px-3 py-2 text-right">Entry $</th>
              <th className="px-3 py-2 text-right">Exit $</th>
              <SortHeader
                label="P&L $"
                field="pnl"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
                align="right"
              />
              <SortHeader
                label="P&L %"
                field="pnlPercent"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
                align="right"
              />
              <SortHeader
                label="Duration"
                field="duration"
                currentField={sortField}
                direction={sortDirection}
                onSort={handleSort}
                align="right"
              />
            </tr>
          </thead>
          <tbody>
            {sortedTrades.map((trade) => (
              <tr
                key={trade.id}
                onClick={() => onTradeClick?.(trade)}
                className={`border-b border-primary-lighter hover:bg-primary-lighter/50 ${
                  onTradeClick ? "cursor-pointer" : ""
                }`}
              >
                <td className="px-3 py-2 text-xs text-gray-300">
                  {formatDate(trade.entryTime)}
                </td>
                <td className="px-3 py-2 text-xs text-gray-300">
                  {formatDate(trade.exitTime)}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                      trade.side === "long"
                        ? "bg-green-900/30 text-green-400"
                        : "bg-red-900/30 text-red-400"
                    }`}
                  >
                    {trade.side === "long" ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                    {trade.side.toUpperCase()}
                  </span>
                </td>
                <td className="px-3 py-2 text-right text-gray-300">
                  {formatCurrency(trade.entryPrice)}
                </td>
                <td className="px-3 py-2 text-right text-gray-300">
                  {formatCurrency(trade.exitPrice)}
                </td>
                <td
                  className={`px-3 py-2 text-right font-medium ${
                    trade.pnl >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {formatCurrency(trade.pnl)}
                </td>
                <td
                  className={`px-3 py-2 text-right font-medium ${
                    trade.pnlPercent >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {formatPercent(trade.pnlPercent)}
                </td>
                <td className="px-3 py-2 text-right text-gray-300">
                  {formatDuration(trade.duration)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
  color = "text-white",
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
        active
          ? "bg-accent-primary text-white"
          : `${color} hover:bg-primary-lighter`
      }`}
    >
      {label}
    </button>
  );
}

function SortHeader({
  label,
  field,
  currentField,
  direction,
  onSort,
  align = "left",
}: {
  label: string;
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  align?: "left" | "right";
}) {
  const isActive = currentField === field;

  return (
    <th
      className={`px-3 py-2 cursor-pointer hover:text-white transition-colors ${
        align === "right" ? "text-right" : ""
      }`}
      onClick={() => onSort(field)}
    >
      <div
        className={`flex items-center gap-1 ${
          align === "right" ? "justify-end" : ""
        }`}
      >
        {label}
        {isActive ? (
          direction === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </div>
    </th>
  );
}
