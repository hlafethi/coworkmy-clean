import { Button } from '@/components/ui/button';
import { Activity, TrendingUp } from 'lucide-react';

interface ModeFiltersProps {
  selectedMode: 'test' | 'live';
  onModeChange: (mode: 'test' | 'live') => void;
}

export const ModeFilters = ({ selectedMode, onModeChange }: ModeFiltersProps) => {
  return (
    <div className="flex gap-2 mb-6">
      <Button 
        variant={selectedMode === 'test' ? 'default' : 'outline'} 
        onClick={() => onModeChange('test')}
        className="flex items-center gap-2"
      >
        <Activity className="h-4 w-4" />
        Mode Test
      </Button>
      <Button 
        variant={selectedMode === 'live' ? 'default' : 'outline'} 
        onClick={() => onModeChange('live')}
        className="flex items-center gap-2"
      >
        <TrendingUp className="h-4 w-4" />
        Mode Production
      </Button>
    </div>
  );
};
