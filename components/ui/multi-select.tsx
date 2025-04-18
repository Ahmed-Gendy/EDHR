"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Command as CommandPrimitive } from "cmdk"

type Option = {
  value: string
  label: string
  group?: string
}

type MultiSelectProps = {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
  id?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options",
  className,
  id,
}: MultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const handleUnselect = (optionValue: string) => {
    onChange(selected.filter((s) => s !== optionValue))
  }

  const handleSelect = (optionValue: string) => {
    if (selected.includes(optionValue)) {
      onChange(selected.filter((s) => s !== optionValue))
    } else {
      onChange([...selected, optionValue])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current
    if (input) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (input.value === "" && selected.length > 0) {
          onChange(selected.slice(0, -1))
        }
      }
      if (e.key === "Escape") {
        input.blur()
      }
    }
  }

  // Group options by their group property
  const groupedOptions = options.reduce(
    (acc, option) => {
      const group = option.group || "Other"
      if (!acc[group]) {
        acc[group] = []
      }
      acc[group].push(option)
      return acc
    },
    {} as Record<string, Option[]>,
  )

  const selectedOptions = selected.map((value) => options.find((option) => option.value === value)?.label || value)

  return (
    <Command onKeyDown={handleKeyDown} className={`overflow-visible bg-transparent ${className}`} id={id}>
      <div className="group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex gap-1 flex-wrap">
          {selected.map((optionValue) => {
            const label = options.find((o) => o.value === optionValue)?.label || optionValue
            return (
              <Badge key={optionValue} variant="secondary" className="mb-1">
                {label}
                <button
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleUnselect(optionValue)
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={() => handleUnselect(optionValue)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            )
          })}
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            placeholder={selected.length === 0 ? placeholder : ""}
            className="ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1 min-w-[120px] h-8"
          />
        </div>
      </div>
      <div className="relative">
        {open && (
          <div className="absolute w-full z-10 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
            <CommandList>
              <CommandInput placeholder="Search..." />
              <CommandEmpty>No results found.</CommandEmpty>
              {Object.entries(groupedOptions).map(([group, groupOptions]) => (
                <CommandGroup key={group} heading={group}>
                  {groupOptions.map((option) => {
                    const isSelected = selected.includes(option.value)
                    return (
                      <CommandItem
                        key={option.value}
                        onSelect={() => handleSelect(option.value)}
                        className={`flex items-center gap-2 ${isSelected ? "bg-accent" : ""}`}
                      >
                        <div
                          className={`border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border ${
                            isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={isSelected ? "opacity-100" : "opacity-0"}
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <span>{option.label}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </div>
        )}
      </div>
    </Command>
  )
}
