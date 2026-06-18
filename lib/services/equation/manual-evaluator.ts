type ManualCompileSuccess = {
  ok: true
  fn: (t: number) => number
}

type ManualCompileFailure = {
  ok: false
  error: string
}

export type ManualCompileResult = ManualCompileSuccess | ManualCompileFailure

const allowedNames = new Set([
  "t",
  "pi",
  "e",
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "sinh",
  "cosh",
  "tanh",
  "exp",
  "log",
  "ln",
  "sqrt",
  "abs",
  "floor",
  "ceil",
  "round",
  "sign",
  "pow",
  "min",
  "max",
])

function hasOnlyAllowedChars(expression: string): boolean {
  return /^[0-9+\-*/^().,\sA-Za-z_]*$/.test(expression)
}

export function compileManualEquation(expression: string): ManualCompileResult {
  const trimmed = expression.trim()

  if (!trimmed) {
    return { ok: false, error: "Expression is empty." }
  }

  if (!hasOnlyAllowedChars(trimmed)) {
    return {
      ok: false,
      error: "Expression contains unsupported characters.",
    }
  }

  const identifiers = trimmed.match(/[A-Za-z_]\w*/g) ?? []
  for (const token of identifiers) {
    const lower = token.toLowerCase()
    if (!allowedNames.has(lower)) {
      return {
        ok: false,
        error: 'Unknown token "' + token + '".',
      }
    }
  }

  let compiled = trimmed.replace(/\^/g, "**")

  const replacements: Array<[RegExp, string]> = [
    [/\bsin\b/gi, "Math.sin"],
    [/\bcos\b/gi, "Math.cos"],
    [/\btan\b/gi, "Math.tan"],
    [/\basin\b/gi, "Math.asin"],
    [/\bacos\b/gi, "Math.acos"],
    [/\batan\b/gi, "Math.atan"],
    [/\bsinh\b/gi, "Math.sinh"],
    [/\bcosh\b/gi, "Math.cosh"],
    [/\btanh\b/gi, "Math.tanh"],
    [/\bexp\b/gi, "Math.exp"],
    [/\blog\b/gi, "Math.log"],
    [/\bln\b/gi, "Math.log"],
    [/\bsqrt\b/gi, "Math.sqrt"],
    [/\babs\b/gi, "Math.abs"],
    [/\bfloor\b/gi, "Math.floor"],
    [/\bceil\b/gi, "Math.ceil"],
    [/\bround\b/gi, "Math.round"],
    [/\bsign\b/gi, "Math.sign"],
    [/\bpow\b/gi, "Math.pow"],
    [/\bmin\b/gi, "Math.min"],
    [/\bmax\b/gi, "Math.max"],
    [/\bpi\b/gi, "Math.PI"],
    [/\be\b/gi, "Math.E"],
  ]

  for (const [pattern, value] of replacements) {
    compiled = compiled.replace(pattern, value)
  }

  try {
    const fn = new Function(
      "t",
      '"use strict"; return (' + compiled + ");"
    ) as (t: number) => number

    const check = fn(0)
    if (!Number.isFinite(check)) {
      return {
        ok: false,
        error: "Expression result is not finite at t = 0.",
      }
    }

    return { ok: true, fn }
  } catch {
    return {
      ok: false,
      error: "Unable to parse expression. Use explicit multiplication, e.g. 2*t.",
    }
  }
}