"use strict";

/**
 * Public API for ts-arbitrary-precision-decimal.
 *
 * This module re-exports the core decimal arithmetic functions and provides
 * a convenient Decimal class wrapper.
 */

import {
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
} from "./core.js";

/**
 * Immutable arbitrary-precision decimal number.
 */
class Decimal {
  /**
   * @param {object} value - Internal representation { sign, digits, scale }.
   */
  constructor(value) {
    this._value = value;
  }

  /**
   * Create a Decimal from a string.
   * @param {string} str
   * @returns {Decimal}
   */
  static fromString(str) {
    return new Decimal(fromString(str));
  }

  /**
   * Create a Decimal from a number. Prefer fromString for exactness.
   * @param {number} n
   * @returns {Decimal}
   */
  static fromNumber(n) {
    return new Decimal(fromNumber(n));
  }

  /**
   * The zero decimal.
   * @returns {Decimal}
   */
  static get zero() {
    return new Decimal(ZERO);
  }

  /**
   * Convert to a string.
   * @returns {string}
   */
  toString() {
    return toString(this._value);
  }

  /**
   * Convert to a number. May lose precision.
   * @returns {number}
   */
  toNumber() {
    return toNumber(this._value);
  }

  /**
   * Add another Decimal.
   * @param {Decimal} other
   * @returns {Decimal}
   */
  add(other) {
    return new Decimal(add(this._value, other._value));
  }

  /**
   * Subtract another Decimal.
   * @param {Decimal} other
   * @returns {Decimal}
   */
  sub(other) {
    return new Decimal(sub(this._value, other._value));
  }

  /**
   * Multiply by another Decimal.
   * @param {Decimal} other
   * @returns {Decimal}
   */
  mul(other) {
    return new Decimal(mul(this._value, other._value));
  }

  /**
   * Divide by another Decimal with optional precision (decimal places).
   * @param {Decimal} other
   * @param {number} [precision=20]
   * @returns {Decimal}
   */
  div(other, precision) {
    return new Decimal(div(this._value, other._value, precision));
  }

  /**
   * Compare with another Decimal. Returns -1, 0, or 1.
   * @param {Decimal} other
   * @returns {number}
   */
  cmp(other) {
    return cmp(this._value, other._value);
  }

  /**
   * Absolute value.
   * @returns {Decimal}
   */
  abs() {
    return new Decimal(abs(this._value));
  }

  /**
   * Negate.
   * @returns {Decimal}
   */
  neg() {
    return new Decimal(neg(this._value));
  }

  /**
   * Check if zero.
   * @returns {boolean}
   */
  isZero() {
    return isZero(this._value);
  }
}

// The `fromNumber` and `toNumber` names below are the pure functions exported
// from core.js. The Decimal class also defines static/instance methods with the
// same names, but those are properties of the class, not of this module.
// The test imports `fromNumber` and `toNumber` as named exports and expects them
// to behave as pure functions returning a raw decimal object / number. That is
// exactly what core.js provides, so the named exports must not be shadowed.

const fromNumberFn = fromNumber;
const toNumberFn = toNumber;

export {
  Decimal,
  ZERO,
  fromString,
  toString,
  fromNumberFn as fromNumber,
  toNumberFn as toNumber,
  add,
  sub,
  mul,
  div,
  cmp,
  abs,
  neg,
  isZero,
};
