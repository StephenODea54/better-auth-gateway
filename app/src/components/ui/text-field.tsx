import type { AnyFieldApi } from "@tanstack/react-form";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";

interface TextFieldProps {
  as?: "input" | "textarea";
  className?: string;
  description?: string;
  disabled?: boolean;
  field: AnyFieldApi;
  label: string;
  placeholder?: string;
  rows?: number;
  type?: string;
}

export function TextField({
  as = "input",
  className,
  description,
  disabled,
  field,
  label,
  placeholder,
  rows,
  type,
}: TextFieldProps) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      {as === "textarea"
        ? (
            <Textarea
              aria-invalid={isInvalid}
              className={className}
              disabled={disabled}
              id={field.name}
              name={field.name}
              onBlur={field.handleBlur}
              onChange={event => field.handleChange(event.target.value)}
              placeholder={placeholder}
              rows={rows}
              value={field.state.value}
            />
          )
        : (
            <Input
              aria-invalid={isInvalid}
              autoComplete="off"
              className={className}
              disabled={disabled}
              id={field.name}
              name={field.name}
              onBlur={field.handleBlur}
              onChange={event => field.handleChange(event.target.value)}
              placeholder={placeholder}
              type={type}
              value={field.state.value}
            />
          )}
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
