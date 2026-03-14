import { useState, useEffect } from 'react'

/**
 * useDebounce — returns a debounced version of `value`.
 *
 * @param {*}      value — value to debounce
 * @param {number} delay — debounce delay in milliseconds
 * @returns debounced value (updated only after `delay` ms of no changes)
 */
export default function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
