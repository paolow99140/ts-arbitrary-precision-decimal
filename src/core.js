"use strict";

/**
 * Arbitrary-precision decimal arithmetic on digit arrays.
 *
 * WHY: Financial calculations need exact decimal arithmetic. Floating point
 * introduces rounding errors (0.1 + 0.2 !== 0.3). Representing numbers as
 * arrays of decimal digits and implementing arithmetic manually gives exact
 * results at the cost of speed and memory.
 *
 * Representation:
 *   A Decimal is { sign: 1 | -1, digits: number[], scale: number }.
 *   - digits holds the significant digits, most significant first.
 *   - No leading zeros (except the single digit 0 for zero).
 *   - scale is the number of digits after the decimal point.
 *   - The value is sign * (digits as integer) * 10^(-scale).
 *   - Zero is always { sign: 1, digits: [0], scale: 0 }.
 *
 * This representation keeps the exact decimal value without floating point.
 */

const ZERO = Object.freeze({ sign: 1, digits: [0], scale: 0 });

/**
 * Normalize a decimal: remove leading zeros from digits, remove trailing zeros
 * from the fractional part by reducing scale, and canonicalize zero.
 *
 * WHY: Normalization makes equality and comparison simpler and prevents
 * unbounded growth of arrays during repeated operations.
 */
function normalize(dec) {
  let { sign, digits, scale } = dec;

  // Remove leading zeros.
  let start = 0;
  while (start < digits.length - 1 && digits[start] === 0) {
    start++;
  }
  if (start > 0) {
    digits = digits.slice(start);
  }

  // Remove trailing zeros in the fractional part.
  while (scale > 0 && digits[digits.length - 1] === 0) {
    digits = digits.slice(0, -1);
    scale--;
  }

  // If all digits are zero, canonicalize to ZERO.
  if (digits.length === 1 && digits[0] === 0) {
    return ZERO;
  }

  // If digits became empty (should not happen after above), reset to [0].
  if (digits.length === 0) {
    return ZERO;
  }

  return { sign, digits, scale };
}

/**
 * Compare two digit arrays (most significant first) as unsigned integers.
 * Returns -1, 0, or 1.
 */
function compareDigits(a, b) {
  // Remove leading zeros for comparison.
  let ai = 0;
  while (ai < a.length - 1 && a[ai] === 0) ai++;
  let bi = 0;
  while (bi < b.length - 1 && b[bi] === 0) bi++;

  const alen = a.length - ai;
  const blen = b.length - bi;
  if (alen !== blen) return alen < blen ? -1 : 1;
  for (let i = 0; i < alen; i++) {
    const av = a[ai + i];
    const bv = b[bi + i];
    if (av !== bv) return av < bv ? -1 : 1;
  }
  return 0;
}

/**
 * Add two unsigned digit arrays (most significant first). Returns a new array.
 */
function addDigits(a, b) {
  const res = [];
  let carry = 0;
  let i = a.length - 1;
  let j = b.length - 1;
  while (i >= 0 || j >= 0 || carry) {
    const av = i >= 0 ? a[i] : 0;
    const bv = j >= 0 ? b[j] : 0;
    const sum = av + bv + carry;
    res.push(sum % 10);
    carry = Math.floor(sum / 10);
    i--;
    j--;
  }
  res.reverse();
  return res;
}

/**
 * Subtract unsigned digit arrays a - b. Assumes a >= b. Returns a new array.
 */
function subDigits(a, b) {
  const res = [];
  let borrow = 0;
  let i = a.length - 1;
  let j = b.length - 1;
  while (i >= 0) {
    let av = a[i] - borrow;
    const bv = j >= 0 ? b[j] : 0;
    if (av < bv) {
      av += 10;
      borrow = 1;
    } else {
      borrow = 0;
    }
    res.push(av - bv);
    i--;
    j--;
  }
  res.reverse();
  return res;
}

/**
 * Multiply two unsigned digit arrays. Returns a new array.
 * Uses schoolbook multiplication.
 */
function mulDigits(a, b) {
  if (a.length === 1 && a[0] === 0) return [0];
  if (b.length === 1 && b[0] === 0) return [0];
  const res = new Array(a.length + b.length).fill(0);
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      const prod = a[i] * b[j] + res[i + j + 1];
      res[i + j + 1] = prod % 10;
      res[i + j] += Math.floor(prod / 10);
    }
  }
  // Remove leading zeros.
  let start = 0;
  while (start < res.length - 1 && res[start] === 0) start++;
  return res.slice(start);
}

/**
 * Divide unsigned digit arrays a / b. Returns { quotient, remainder }.
 * Uses long division. b must not be zero.
 */
function divModDigits(a, b) {
  if (b.length === 1 && b[0] === 0) {
    throw new Error("Division by zero");
  }
  if (compareDigits(a, b) < 0) {
    return { quotient: [0], remainder: a.slice() };
  }
  const quotient = [];
  let remainder = [];
  for (let i = 0; i < a.length; i++) {
    // Bring down next digit.
    remainder.push(a[i]);
    // Remove leading zeros from remainder.
    while (remainder.length > 1 && remainder[0] === 0) remainder.shift();
    // Find how many times b fits into remainder.
    let q = 0;
    while (compareDigits(remainder, b) >= 0) {
      remainder = subDigits(remainder, b);
      q++;
    }
    quotient.push(q);
  }
  // Remove leading zeros from quotient.
  let start = 0;
  while (start < quotient.length - 1 && quotient[start] === 0) start++;
  return { quotient: quotient.slice(start), remainder };
}

/**
 * Create a Decimal from a string. Accepts optional sign, digits, and decimal point.
 * Throws on invalid input.
 */
function fromString(str) {
  if (typeof str !== "string") {
    throw new TypeError("Expected a string");
  }
  str = str.trim();
  if (str === "") throw new Error("Empty string");

  let sign = 1;
  if (str[0] === "+") {
    str = str.slice(1);
  } else if (str[0] === "-") {
    sign = -1;
    str = str.slice(1);
  }

  if (str === "") throw new Error("Invalid number format");

  const parts = str.split(".");
  if (parts.length > 2) throw new Error("Invalid number format");

  let intPart = parts[0];
  let fracPart = parts.length === 2 ? parts[1] : "";

  if (!/^\d*$/.test(intPart) || !/^\d*$/.test(fracPart)) {
    throw new Error("Invalid number format");
  }
  if (intPart === "" && fracPart === "") {
    throw new Error("Invalid number format");
  }

  const digitsStr = (intPart + fracPart).replace(/^0+/, "") || "0";
  const digits = digitsStr.split("").map(Number);
  const scale = fracPart.length;

  return normalize({ sign, digits, scale });
}

/**
 * Convert a Decimal to a string.
 */
function toString(dec) {
  const { sign, digits, scale } = dec;
  let s = digits.join("");
  if (scale > 0) {
    if (s.length <= scale) {
      s = "0".repeat(scale - s.length + 1) + s;
    }
    const point = s.length - scale;
    s = s.slice(0, point) + "." + s.slice(point);
  }
  return (sign < 0 ? "-" : "") + s;
}

/**
 * Create a Decimal from a number. Only safe if the number is an integer or
 * has a short decimal representation. For exactness, prefer fromString.
 *
 * WHY: Numbers like 0.1 are not exactly representable in binary. We convert
 * via toString, which gives the shortest decimal that round-trips.
 */
function fromNumber(n) {
  if (!Number.isFinite(n)) {
    throw new Error("Cannot convert non-finite number");
  }
  return fromString(n.toString());
}

/**
 * Convert a Decimal to a number. May lose precision.
 */
function toNumber(dec) {
  return Number(toString(dec));
}

/**
 * Add two Decimals.
 */
function add(a, b) {
  // Align scales.
  const scale = Math.max(a.scale, b.scale);
  const aDigits = a.digits.concat(new Array(scale - a.scale).fill(0));
  const bDigits = b.digits.concat(new Array(scale - b.scale).fill(0));

  let sign, digits;
  if (a.sign === b.sign) {
    digits = addDigits(aDigits, bDigits);
    sign = a.sign;
  } else {
    const cmp = compareDigits(aDigits, bDigits);
    if (cmp === 0) {
      return ZERO;
    } else if (cmp > 0) {
      digits = subDigits(aDigits, bDigits);
      sign = a.sign;
    } else {
      digits = subDigits(bDigits, aDigits);
      sign = b.sign;
    }
  }
  return normalize({ sign, digits, scale });
}

/**
 * Subtract b from a.
 */
function sub(a, b) {
  return add(a, { sign: -b.sign, digits: b.digits, scale: b.scale });
}

/**
 * Multiply two Decimals.
 */
function mul(a, b) {
  const sign = a.sign * b.sign;
  const digits = mulDigits(a.digits, b.digits);
  const scale = a.scale + b.scale;
  return normalize({ sign, digits, scale });
}

/**
 * Divide a by b with a given precision (number of decimal places).
 * Throws if b is zero.
 *
 * WHY: Division may not terminate in decimal (e.g., 1/3). We require the
 * caller to specify precision, defaulting to 20 decimal places.
 */
function div(a, b, precision = 20) {
  if (b.digits.length === 1 && b.digits[0] === 0) {
    throw new Error("Division by zero");
  }
  if (!Number.isInteger(precision) || precision < 0) {
    throw new Error("Precision must be a non-negative integer");
  }

  // We want to compute a / b with `precision` decimal places.
  // Scale both numbers to work with integers.
  // a / b = (a.digits * 10^-a.scale) / (b.digits * 10^-b.scale)
  //       = (a.digits / b.digits) * 10^(b.scale - a.scale)
  // To get `precision` decimal places, multiply numerator by 10^(precision + a.scale - b.scale).
  const scaleDiff = precision + a.scale - b.scale;
  let numerator = a.digits.slice();
  let denominator = b.digits.slice();
  if (scaleDiff > 0) {
    numerator = numerator.concat(new Array(scaleDiff).fill(0));
  } else if (scaleDiff < 0) {
    denominator = denominator.concat(new Array(-scaleDiff).fill(0));
  }

  const { quotient, remainder } = divModDigits(numerator, denominator);

  // Round half up based on remainder.
  let q = quotient.slice();
  if (remainder.length > 0 && !(remainder.length === 1 && remainder[0] === 0)) {
    // Compare 2 * remainder with denominator.
    const twiceRem = mulDigits(remainder, [2]);
    if (compareDigits(twiceRem, denominator) >= 0) {
      q = addDigits(q, [1]);
    }
  }

  const sign = a.sign * b.sign;
  return normalize({ sign, digits: q, scale: precision });
}

/**
 * Compare two Decimals. Returns -1, 0, or 1.
 */
function cmp(a, b) {
  if (a.sign !== b.sign) {
    return a.sign < b.sign ? -1 : 1;
  }
  // Same sign: compare absolute values, then invert if negative.
  const scale = Math.max(a.scale, b.scale);
  const aDigits = a.digits.concat(new Array(scale - a.scale).fill(0));
  const bDigits = b.digits.concat(new Array(scale - b.scale).fill(0));
  const c = compareDigits(aDigits, bDigits);
  return a.sign < 0 ? -c : c;
}

/**
 * Return the absolute value.
 */
function abs(a) {
  return { sign: 1, digits: a.digits, scale: a.scale };
}

/**
 * Negate a Decimal.
 */
function neg(a) {
  return { sign: -a.sign, digits: a.digits, scale: a.scale };
}

/**
 * Check if a Decimal is zero.
 */
function isZero(a) {
  return a.digits.length === 1 && a.digits[0] === 0;
}

export {
  ZERO,
  fromString,
  toString,
  fromNumber,
  toNumber,
  add,
  sub,
  mul,
  div,
  cmp,
  abs,
  neg,
  isZero,
  normalize,
};
