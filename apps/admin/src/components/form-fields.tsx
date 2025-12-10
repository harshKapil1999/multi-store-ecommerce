import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  helperText?: string;
  className?: string;
}

export const FormInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & FormFieldProps
>(({ label, error, required, helperText, className, ...props }, ref) => (
  <div className="space-y-2">
    {label && (
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
    )}
    <Input
      ref={ref}
      className={error ? 'border-red-500' : ''}
      {...props}
    />
    {error && <p className="text-sm text-red-500">{error}</p>}
    {helperText && <p className="text-sm text-muted-foreground">{helperText}</p>}
  </div>
));
FormInput.displayName = 'FormInput';

export const FormTextarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & FormFieldProps
>(({ label, error, required, helperText, className, ...props }, ref) => (
  <div className="space-y-2">
    {label && (
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
    )}
    <Textarea
      ref={ref}
      className={error ? 'border-red-500' : ''}
      {...props}
    />
    {error && <p className="text-sm text-red-500">{error}</p>}
    {helperText && <p className="text-sm text-muted-foreground">{helperText}</p>}
  </div>
));
FormTextarea.displayName = 'FormTextarea';

export interface FormSelectProps extends FormFieldProps {
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export const FormSelect = forwardRef<HTMLButtonElement, FormSelectProps>(
  ({ label, error, required, helperText, options, placeholder, value, onValueChange }, ref) => (
    <div className="space-y-2">
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Select value={value || ''} onValueChange={onValueChange}>
        <SelectTrigger ref={ref} className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder={placeholder || 'Select an option'} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {helperText && <p className="text-sm text-muted-foreground">{helperText}</p>}
    </div>
  )
);
FormSelect.displayName = 'FormSelect';

export interface FormCheckboxProps extends FormFieldProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const FormCheckbox = forwardRef<HTMLButtonElement, FormCheckboxProps>(
  ({ label, error, helperText, checked, onCheckedChange }, ref) => (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox
          ref={ref}
          checked={checked}
          onCheckedChange={onCheckedChange}
        />
        {label && <Label>{label}</Label>}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {helperText && <p className="text-sm text-muted-foreground">{helperText}</p>}
    </div>
  )
);
FormCheckbox.displayName = 'FormCheckbox';
