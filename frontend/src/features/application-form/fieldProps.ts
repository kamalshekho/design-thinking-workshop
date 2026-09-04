import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import { errorText } from '../../content/de';
import type { FormValues } from './schema';

export function toErrorText(message: string | undefined): string | undefined {
  return message ? errorText(message) : undefined;
}

/**
 * Binds `register` and `errors` from a single `useForm()` call once, so call
 * sites only name the field: `const { error, ...control } = fieldProps('email')`.
 */
export function makeFieldProps(
  register: UseFormRegister<FormValues>,
  errors: FieldErrors<FormValues>,
) {
  return function fieldProps<Name extends keyof FormValues>(name: Name) {
    return {
      ...register(name),
      error: toErrorText(errors[name]?.message),
    };
  };
}
