/// <reference types="node"/>

declare module 'parse-xsd-duration' {
  type ObjectResult = { years: number, months: number, days: number, hours: number, minutes: number, seconds: number, isNegative: number }
  function parseXsdDuration(input: string, toObject?: false): number
  function parseXsdDuration(input: string, toObject: true): ObjectResult
  export default parseXsdDuration
}

