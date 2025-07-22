import { useState, useEffect, useMemo } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import commoditiesData from '@shared/commodities.json';

export interface Commodity {
  category: string;
  english: string;
  hindi: string;
}

interface CommoditySelectorProps {
  value?: string;
  onChange: (value: string) => void;
  onCategorySelect?: (category: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CommoditySelector({ value, onChange, onCategorySelect, placeholder = "Select commodity...", disabled }: CommoditySelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const commodities = commoditiesData as Commodity[];

  // Debug log
  console.log('CommoditySelector: Total commodities loaded:', commodities.length);

  // Group commodities by category
  const categorizedCommodities = useMemo(() => {
    const categories: Record<string, Commodity[]> = {};
    commodities.forEach(commodity => {
      if (!categories[commodity.category]) {
        categories[commodity.category] = [];
      }
      categories[commodity.category].push(commodity);
    });
    console.log('CommoditySelector: Categorized commodities:', categories);
    return categories;
  }, [commodities]);

  // Advanced filter commodities based on search with fuzzy matching
  const filteredCommodities = useMemo(() => {
    if (!searchValue.trim()) {
      console.log('CommoditySelector: No search value, showing all categories:', Object.keys(categorizedCommodities));
      return categorizedCommodities;
    }
    
    const searchLower = searchValue.toLowerCase().trim();
    const filtered: Record<string, Commodity[]> = {};
    
    Object.entries(categorizedCommodities).forEach(([category, items]) => {
      const matchingItems = items.filter(item => {
        // Full name matches
        const fullName = `${item.english} (${item.hindi})`.toLowerCase();
        if (fullName.includes(searchLower)) return true;
        
        // Individual field matches
        if (item.english.toLowerCase().includes(searchLower) ||
            item.hindi.includes(searchValue) ||
            category.toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // Word-based fuzzy matching
        const englishWords = item.english.toLowerCase().split(/\s+/);
        const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0);
        
        // Check if search matches start of any word or vice versa
        return searchWords.some(searchWord => 
          englishWords.some(commodityWord => 
            (searchWord.length >= 2 && commodityWord.startsWith(searchWord)) ||
            (commodityWord.length >= 2 && searchWord.startsWith(commodityWord)) ||
            commodityWord.includes(searchWord)
          )
        );
      });
      
      if (matchingItems.length > 0) {
        filtered[category] = matchingItems;
      }
    });
    return filtered;
  }, [categorizedCommodities, searchValue]);

  // Format display value
  const formatCommodityName = (commodity: Commodity) => {
    return `${commodity.english} (${commodity.hindi})`;
  };

  // Find selected commodity
  const selectedCommodity = commodities.find(c => 
    formatCommodityName(c) === value || c.english === value
  );

  const handleSelect = (commodity: Commodity) => {
    const formattedName = formatCommodityName(commodity);
    onChange(formattedName);
    setSearchValue('');
    setOpen(false);
    
    // Call onCategorySelect if provided to auto-populate category
    if (onCategorySelect) {
      onCategorySelect(commodity.category);
    }
  };

  // Category colors
  const getCategoryColor = (category: string) => {
    const colors = {
      'Grains': 'text-amber-600 bg-amber-50',
      'Pulses': 'text-green-600 bg-green-50',
      'Spices': 'text-red-600 bg-red-50',
      'Oilseeds': 'text-blue-600 bg-blue-50',
      'Fibres': 'text-purple-600 bg-purple-50',
      'Cash Crops': 'text-emerald-600 bg-emerald-50',
      'Nuts': 'text-orange-600 bg-orange-50'
    };
    return colors[category as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedCommodity ? (
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="truncate">{formatCommodityName(selectedCommodity)}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Type to search commodities..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-2">No commodity found.</p>
                {searchValue.trim() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onChange(searchValue.trim());
                      setOpen(false);
                      setSearchValue('');
                    }}
                  >
                    Add "{searchValue.trim()}" as custom commodity
                  </Button>
                )}
              </div>
            </CommandEmpty>
            
            {Object.entries(filteredCommodities).map(([category, items]) => (
              <CommandGroup key={category} heading={
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-md ${getCategoryColor(category)}`}>
                    {category}
                  </span>
                  <span className="text-xs text-muted-foreground">({items.length})</span>
                </div>
              }>
                {items.map((commodity) => {
                  const isSelected = selectedCommodity?.english === commodity.english;
                  return (
                    <CommandItem
                      key={`${commodity.category}-${commodity.english}`}
                      value={`${commodity.english} ${commodity.hindi}`}
                      onSelect={() => handleSelect(commodity)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{commodity.english}</span>
                          <span className="text-xs text-muted-foreground">{commodity.hindi}</span>
                        </div>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}