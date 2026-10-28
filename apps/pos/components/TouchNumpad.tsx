import React from 'react';
import { formatVND } from '@/lib/utils';
import { Delete, CheckCircle2 } from 'lucide-react';

interface TouchNumpadProps {
  value: string;
  onChange: (val: string) => void;
  targetAmount: number;
  onConfirm?: () => void;
}

export const TouchNumpad: React.FC<TouchNumpadProps> = ({
  value,
  onChange,
  targetAmount,
  onConfirm,
}) => {
  const currentNum = Number(value.replace(/\D/g, '')) || 0;
  const changeAmount = Math.max(0, currentNum - targetAmount);

  const handleKey = (key: string) => {
    if (key === 'BACK') {
      onChange(value.slice(0, -1));
    } else if (key === 'CLEAR') {
      onChange('');
    } else if (key === 'EXACT') {
      onChange(String(targetAmount));
    } else {
      onChange(value + key);
    }
  };

  const handleQuickAdd = (preset: number) => {
    onChange(String(preset));
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-card rounded-2xl border border-border">
      {/* Display Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-background rounded-xl border border-border">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Khách đưa</span>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            {formatVND(currentNum)}
          </div>
        </div>
        <div className="p-3 bg-background rounded-xl border border-border">
          <span className="text-xs text-muted-foreground uppercase font-semibold">Tiền thối lại</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {formatVND(changeAmount)}
          </div>
        </div>
      </div>

      {/* Quick Tender Presets */}
      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => handleQuickAdd(targetAmount)}
          className="py-2.5 px-2 bg-primary/10 border border-primary/30 text-primary font-bold text-xs rounded-xl hover:bg-primary/20 active:scale-95 transition-all text-center"
        >
          Đủ tiền
        </button>
        <button
          type="button"
          onClick={() => handleQuickAdd(100000)}
          className="py-2.5 px-2 bg-secondary text-foreground font-semibold text-xs rounded-xl hover:bg-secondary/80 active:scale-95 transition-all text-center"
        >
          100k
        </button>
        <button
          type="button"
          onClick={() => handleQuickAdd(200000)}
          className="py-2.5 px-2 bg-secondary text-foreground font-semibold text-xs rounded-xl hover:bg-secondary/80 active:scale-95 transition-all text-center"
        >
          200k
        </button>
        <button
          type="button"
          onClick={() => handleQuickAdd(500000)}
          className="py-2.5 px-2 bg-secondary text-foreground font-semibold text-xs rounded-xl hover:bg-secondary/80 active:scale-95 transition-all text-center"
        >
          500k
        </button>
      </div>

      {/* 4x3 Touch Numpad */}
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '000'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleKey(digit)}
            className="py-4 bg-secondary text-foreground font-bold text-lg rounded-xl hover:bg-muted active:scale-95 transition-all select-none shadow-sm"
          >
            {digit}
          </button>
        ))}
      </div>

      {/* Control Row */}
      <div className="grid grid-cols-2 gap-2 mt-1">
        <button
          type="button"
          onClick={() => handleKey('BACK')}
          className="py-3 bg-secondary text-amber-400 font-semibold rounded-xl flex items-center justify-center gap-1.5 hover:bg-secondary/80 active:scale-95"
        >
          <Delete className="w-4 h-4" />
          <span>Xóa</span>
        </button>
        <button
          type="button"
          onClick={() => handleKey('CLEAR')}
          className="py-3 bg-secondary text-destructive font-semibold rounded-xl hover:bg-secondary/80 active:scale-95"
        >
          Xóa hết (C)
        </button>
      </div>

      {/* Confirm Button */}
      {onConfirm && (
        <button
          type="button"
          onClick={onConfirm}
          disabled={currentNum < targetAmount}
          className="w-full py-4 bg-primary text-primary-foreground font-bold text-base rounded-xl mt-2 flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-all active:scale-98"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Xác nhận thu tiền</span>
        </button>
      )}
    </div>
  );
};
