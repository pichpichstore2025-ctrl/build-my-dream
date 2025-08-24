
'use client';

import * as React from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface NumericInputProps
  extends Omit<React.ComponentProps<'input'>, 'onChange' | 'value'> {
  value?: number | null;
  onChange?: (value: number | null) => void;
  onValueChange?: (value: number | null) => void;
  allowNegative?: boolean;
}

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  (
    {
      className,
      value: propValue,
      onChange,
      onValueChange,
      allowNegative = false,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = React.useState('');

    React.useEffect(() => {
      if (propValue != null && propValue !== parseFloat(displayValue.replace(/,/g, ''))) {
        setDisplayValue(
          propValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );
      } else if (propValue == null) {
        setDisplayValue('');
      }
    }, [propValue]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;
      
      // Remove all non-digit, non-dot, non-negative characters
      const negativeSign = allowNegative && val.startsWith('-') ? '-' : '';
      val = val.replace(/[^0-9.]/g, '');
      
      // Ensure only one decimal point
      const parts = val.split('.');
      if (parts.length > 2) {
        val = parts[0] + '.' + parts.slice(1).join('');
      }

      // Limit to 2 decimal places
      if (parts[1] && parts[1].length > 2) {
        parts[1] = parts[1].substring(0, 2);
        val = parts.join('.');
      }

      const numericValue = val ? parseFloat(val) : null;
      
      let formattedValue = val;
      if (val) {
        const [integerPart, decimalPart] = val.split('.');
        formattedValue =
          parseInt(integerPart, 10).toLocaleString('en-US') +
          (decimalPart !== undefined ? '.' + decimalPart : '');
      }

      setDisplayValue(negativeSign + formattedValue);
      
      const finalNumericValue = numericValue !== null ? (negativeSign ? -numericValue : numericValue) : null;

      if (onChange) {
        const mockEvent = {
          target: { ...e.target, value: finalNumericValue }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        (onChange as Function)(mockEvent);
      }
      if (onValueChange) {
        onValueChange(finalNumericValue);
      }
    };
    
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      let val = e.target.value.replace(/,/g, '');
      const numericValue = val ? parseFloat(val) : null;

      if (numericValue != null) {
         setDisplayValue(
          numericValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        );
      } else {
        setDisplayValue('');
      }

      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    return (
      <Input
        type="text"
        className={cn('text-right', className)}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        ref={ref}
        {...props}
      />
    );
  }
);

NumericInput.displayName = 'NumericInput';

export { NumericInput };
