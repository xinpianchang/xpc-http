export namespace Env {
  export function boolean(val: string | number | boolean | undefined): boolean {
    if (typeof val === 'number') {
      return !!val
    }
    if (typeof val === 'boolean') {
      return val
    }
    if (val === 'true' || val === '1') {
      return true
    }
    if (val === 'false' || val === '0') {
      return false
    }
    return false
  }

  export function string(val: string | number | boolean | undefined): string {
    if (val) {
      return String(val)
    }
    return ''
  }

  export function number(val: string | number | boolean | undefined): number {
    const num = Number(val)
    return isNaN(num) ? 0 : num
  }
}
