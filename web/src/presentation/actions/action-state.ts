/**
 * The shape every form action returns and every form renders from.
 *
 * `values` echoes what the user typed so a failed submit never wipes the form.
 */
export interface ActionState {
  readonly status: 'idle' | 'success' | 'error'
  readonly message: string | null
  readonly fieldErrors: Readonly<Record<string, string>>
  readonly values: Readonly<Record<string, string>>
}

export const idleState: ActionState = {status: 'idle', message: null, fieldErrors: {}, values: {}}

export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') values[key] = value
  }
  return values
}

export function failure(
  message: string,
  values: Record<string, string>,
  fieldErrors: Record<string, string> = {},
): ActionState {
  return {status: 'error', message, fieldErrors, values}
}

export function success(message: string): ActionState {
  return {status: 'success', message, fieldErrors: {}, values: {}}
}
