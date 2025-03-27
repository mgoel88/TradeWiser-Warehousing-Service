
import React, { useState, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';

interface CommodityAutosuggestProps {
  onSelect: (commodity: any) => void;
  value?: string;
}

export function CommodityAutosuggest({ onSelect, value }: CommodityAutosuggestProps) {
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);

  const { data: commodities } = useQuery({
    queryKey: ['/api/commodity-categories'],
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedValue
            ? commodities?.find((commodity: any) => commodity.name === selectedValue)?.name
            : "Select commodity..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search commodity..." />
          <CommandEmpty>No commodity found.</CommandEmpty>
          <CommandGroup>
            {commodities?.map((commodity: any) => (
              <CommandItem
                key={commodity.id}
                value={commodity.name}
                onSelect={(currentValue) => {
                  setSelectedValue(currentValue);
                  setOpen(false);
                  onSelect(commodity);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedValue === commodity.name ? "opacity-100" : "opacity-0"
                  )}
                />
                {commodity.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
