export interface Validator {
  id: number
  name: string
  email: string
  is_active_validator: boolean
  validation_count: number
  must_change_password: boolean
}

export interface ValidatorPayload {
  name: string
  email: string
  temporaryPassword: string
}
