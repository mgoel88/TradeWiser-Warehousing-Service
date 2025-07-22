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
        
        // Enhanced search matching
        const englishMatch = item.english.toLowerCase().includes(searchLower);
        const hindiMatch = item.hindi.includes(searchValue);
        const categoryMatch = category.toLowerCase().includes(searchLower);
        
        // Transliteration-like matching (basic phonetic matching)
        const transliterationMatches = () => {
          const transliterationMap: Record<string, string[]> = {
            'rice': ['चावल', 'chawal'],
            'wheat': ['गेहूं', 'gehun'],
            'maize': ['मक्का', 'makka'],
            'sorghum': ['ज्वार', 'jwar'],
            'barley': ['जौ', 'jau'],
            'chickpea': ['चना', 'chana'],
            'turmeric': ['हल्दी', 'haldi'],
            'cumin': ['जीरा', 'jeera'],
            'coriander': ['धनिया', 'dhaniya'],
            'mustard': ['सरसों', 'sarson'],
            'cotton': ['कपास', 'kapas'],
            'almond': ['बादाम', 'badam'],
            'cashew': ['काजू', 'kaju']
          };
          
          const searchKey = item.english.toLowerCase();
          const variants = transliterationMap[searchKey] || [];
          return variants.some(variant => 
            variant.toLowerCase().includes(searchLower) || 
            searchLower.includes(variant.toLowerCase())
          );
        };
        
        if (englishMatch || hindiMatch || categoryMatch || transliterationMatches()) {
          return true;
        }
        
        // Word-based fuzzy matching
        const englishWords = item.english.toLowerCase().split(/\s+/);
        const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0);
        
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
    
    console.log(`CommoditySelector: Search "${searchValue}" found ${Object.values(filtered).flat().length} results`);
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
    console.log('CommoditySelector: handleSelect called with:', commodity);
    const formattedName = formatCommodityName(commodity);
    console.log('CommoditySelector: Selected commodity:', formattedName, 'Category:', commodity.category);
    
    // Clear search and close dropdown first
    setSearchValue('');
    setOpen(false);
    
    // Then call onChange
    onChange(formattedName);
    
    // Call onCategorySelect if provided to auto-populate category
    if (onCategorySelect) {
      console.log('CommoditySelector: Auto-populating category:', commodity.category);
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
        <div className="flex flex-col overflow-hidden">
          <div className="flex items-center border-b px-3">
            <input
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Type to search commodities..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1">
            {Object.keys(filteredCommodities).length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-2">No commodity found.</p>
                {searchValue.trim() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('Adding custom commodity:', searchValue.trim());
                      onChange(searchValue.trim());
                      setOpen(false);
                      setSearchValue('');
                    }}
                  >
                    Add "{searchValue.trim()}" as custom commodity
                  </Button>
                )}
              </div>
            ) : (
              Object.entries(filteredCommodities).map(([category, items]) => (
                <div key={category} className="mb-2">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    {category} ({items.length})
                  </div>
                  <div className="space-y-1">
                    {items.map((commodity) => {
                      const isSelected = selectedCommodity?.english === commodity.english;
                      return (
                    <div
                      key={`${commodity.category}-${commodity.english}`}
                      className="flex items-center justify-between cursor-pointer hover:bg-accent hover:text-accent-foreground px-2 py-1.5 rounded-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Commodity clicked:', commodity.english);
                        handleSelect(commodity);
                      }}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm font-medium truncate">{commodity.english}</span>
                          <span className="text-xs text-muted-foreground truncate">{commodity.hindi}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 shrink-0" />
                      )}
                    </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}