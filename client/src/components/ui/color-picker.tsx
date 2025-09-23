import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  label?: string;
}

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#A855F7", // Purple
  "#DC2626", // Red 600
  "#059669", // Emerald 600
  "#D97706", // Amber 600
  "#7C3AED", // Violet 600
];

export function ColorPicker({ value = "#3B82F6", onChange, label }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(value);

  const handlePresetColor = (color: string) => {
    setCustomColor(color);
    onChange(color);
  };

  const handleCustomColor = (color: string) => {
    setCustomColor(color);
    onChange(color);
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start"
            data-testid="color-picker-trigger"
          >
            <div
              className="w-4 h-4 rounded-full mr-2 border border-gray-300"
              style={{ backgroundColor: value }}
            />
            {value}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Cores Predefinidas</Label>
              <div className="grid grid-cols-8 gap-2 mt-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${
                      value === color 
                        ? "border-gray-900 dark:border-gray-100" 
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handlePresetColor(color)}
                    data-testid={`preset-color-${color}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="custom-color" className="text-sm font-medium">
                Cor Personalizada
              </Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  id="custom-color"
                  type="color"
                  value={customColor}
                  onChange={(e) => handleCustomColor(e.target.value)}
                  className="w-16 h-10 p-1 cursor-pointer"
                  data-testid="color-input"
                />
                <Input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  onBlur={(e) => {
                    // Validate hex color format
                    const hex = e.target.value;
                    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                      onChange(hex);
                    } else {
                      setCustomColor(value); // Reset to current value if invalid
                    }
                  }}
                  placeholder="#3B82F6"
                  className="flex-1"
                  data-testid="color-hex-input"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Use formato hexadecimal (ex: #3B82F6)
              </p>
            </div>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-12 h-12 rounded-lg border border-gray-300"
                    style={{ backgroundColor: value }}
                  />
                  <div>
                    <p className="text-sm font-medium">Preview</p>
                    <p className="text-xs text-muted-foreground">{value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}