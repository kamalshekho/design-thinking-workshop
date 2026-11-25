import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import type { Content } from '../../content/types';
import { isErrorCode } from '../../lib/errorCodes';
import type { FormValues } from './schema';

export function toErrorText(
  message: string | undefined,
  content: Content,
): string | undefined {
  if (!message) return undefined;

  return isErrorCode(message) ? content.errors[message] : content.unknownError;
}

/**
 * Binds `register` and `errors` from a single `useForm()` call once, so call
 * sites only name the field: `const { error, ...control } = fieldProps('email')`.
 */
export function makeFieldProps(
  register: UseFormRegister<FormValues>,
  errors: FieldErrors<FormValues>,
  content: Content,
) {
  return function fieldProps<Name extends keyof FormValues>(name: Name) {
    return {
      ...register(name),
      error: toErrorText(errors[name]?.message, content),
    };
  };
}
