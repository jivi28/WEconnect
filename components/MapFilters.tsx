"use client"

import { useState } from "react"
import { Plus, X, Calendar } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Props {
  from: string
  to: string
  setFrom: (v: string) => void
  setTo: (v: string) => void
}

const chip =
  "flex items-center gap-1 rounded-lg bg-white/85 backdrop-blur-sm border border-[#1d252d]/10 shadow-sm pl-2 pr-1 py-1 text-xs font-semibold text-[#1d252d]"
const xBtn =
  "rounded p-0.5 text-[#1d252d]/40 hover:text-[#e93037] hover:bg-[#e93037]/10 transition-colors"

export default function MapFilters({ from, to, setFrom, setTo }: Props) {
  const [open, setOpen] = useState(false)
  const hasFilters = !!from || !!to

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {from && (
        <div className={chip}>
          <Calendar className="h-3 w-3 text-[#1d252d]/50" />
          <span>After {from}</span>
          <button className={xBtn} onClick={() => setFrom("")} aria-label="Clear after date">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      {to && (
        <div className={chip}>
          <Calendar className="h-3 w-3 text-[#1d252d]/50" />
          <span>Before {to}</span>
          <button className={xBtn} onClick={() => setTo("")} aria-label="Clear before date">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-1 rounded-lg border border-dashed border-[#1d252d]/25 bg-white/85 backdrop-blur-sm shadow-sm px-2 py-1 text-xs font-semibold text-[#1d252d]/70 hover:border-[#e93037]/40 hover:text-[#e93037] transition-colors">
            <Plus className="h-3 w-3" /> Filter
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-3 space-y-2">
          <div>
            <label className="block text-[10px] font-semibold text-[#1d252d]/60 mb-1">After</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg bg-[#1d252d]/5 border border-[#1d252d]/10 text-xs text-[#1d252d] font-medium focus:outline-none focus:ring-1 focus:ring-[#e93037]/50"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[#1d252d]/60 mb-1">Before</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg bg-[#1d252d]/5 border border-[#1d252d]/10 text-xs text-[#1d252d] font-medium focus:outline-none focus:ring-1 focus:ring-[#e93037]/50"
            />
          </div>
          {hasFilters && (
            <button
              onClick={() => {
                setFrom("")
                setTo("")
              }}
              className="w-full pt-1 text-xs font-semibold text-[#1d252d]/50 hover:text-[#e93037] transition-colors"
            >
              Clear all
            </button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
