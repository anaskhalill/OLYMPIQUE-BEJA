import { twMerge } from "tailwind-merge"

export function cn(...inputs: any[]) {
  // Custom clsx replacement logic
  const classes: string[] = []
  
  inputs.forEach(input => {
    if (!input) return
    
    if (typeof input === 'string') {
      classes.push(input)
    } else if (typeof input === 'number') {
      classes.push(String(input))
    } else if (Array.isArray(input)) {
      classes.push(cn(...input))
    } else if (typeof input === 'object') {
      for (const key in input) {
        if (input[key]) {
          classes.push(key)
        }
      }
    }
  })
  
  return twMerge(classes.join(' '))
}