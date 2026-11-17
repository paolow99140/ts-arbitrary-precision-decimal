"use strict";

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  Decimal,
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
} from "../src/index.js";

test("fromString and toString round-trip", () => {
  assert.equal(toString(fromString("123.45")), "123.45");
  assert.equal(toString(fromString("-0.001")), "-0.001");
  assert.equal(toString(fromString("0")), "0");
  assert.equal(toString(fromString("000123.4500")), "123.45");
  assert.equal(toString(fromString(".5")), "0.5");
  assert.equal(toString(fromString("5.")), "5");
});

test("fromString rejects invalid input", () => {
  assert.throws(() => fromString(""), /Empty string/);
  assert.throws(() => fromString("abc"), /Invalid number format/);
  assert.throws(() => fromString("1.2.3"), /Invalid number format/);
  assert.throws(() => fromString("1..2"), /Invalid number format/);
});

test("add exact decimals", () => {
  assert.equal(toString(add(fromString("0.1"), fromString("0.2"))), "0.3");
  assert.equal(toString(add(fromString("1.23"), fromString("4.77"))), "6");
  assert.equal(toString(add(fromString("-1.5"), fromString("1.5"))), "0");
  assert.equal(toString(add(fromString("999.999"), fromString("0.001"))), "1000");
});

test("sub exact decimals", () => {
  assert.equal(toString(sub(fromString("0.3"), fromString("0.1"))), "0.2");
  assert.equal(toString(sub(fromString("1"), fromString("0.999"))), "0.001");
  assert.equal(toString(sub(fromString("-1"), fromString("-2"))), "1");
});

test("mul exact decimals", () => {
  assert.equal(toString(mul(fromString("0.1"), fromString("0.2"))), "0.02");
  assert.equal(toString(mul(fromString("1.5"), fromString("2"))), "3");
  assert.equal(toString(mul(fromString("-3"), fromString("4"))), "-12");
  assert.equal(toString(mul(fromString("0"), fromString("123.45"))), "0");
});

test("div with precision and rounding", () => {
  assert.equal(toString(div(fromString("1"), fromString("3"), 5)), "0.33333");
  assert.equal(toString(div(fromString("2"), fromString("3"), 5)), "0.66667");
  assert.equal(toString(div(fromString("1"), fromString("2"), 2)), "0.5");
  assert.equal(toString(div(fromString("10"), fromString("4"), 2)), "2.5");
  assert.equal(toString(div(fromString("1"), fromString("8"), 3)), "0.125");
});

test("div by zero throws", () => {
  assert.throws(() => div(fromString("1"), fromString("0")), /Division by zero/);
});

test("cmp compares correctly", () => {
  assert.equal(cmp(fromString("1.23"), fromString("1.23")), 0);
  assert.equal(cmp(fromString("1.23"), fromString("1.24")), -1);
  assert.equal(cmp(fromString("1.24"), fromString("1.23")), 1);
  assert.equal(cmp(fromString("-1"), fromString("1")), -1);
  assert.equal(cmp(fromString("-2"), fromString("-1")), -1);
  assert.equal(cmp(fromString("0"), fromString("-0")), 0);
});

test("abs and neg", () => {
  assert.equal(toString(abs(fromString("-1.5"))), "1.5");
  assert.equal(toString(neg(fromString("1.5"))), "-1.5");
  assert.equal(toString(neg(fromString("-1.5"))), "1.5");
});

test("isZero", () => {
  assert.equal(isZero(fromString("0")), true);
  assert.equal(isZero(fromString("0.000")), true);
  assert.equal(isZero(fromString("0.001")), false);
});

test("Decimal class wrapper", () => {
  const a = Decimal.fromString("0.1");
  const b = Decimal.fromString("0.2");
  assert.equal(a.add(b).toString(), "0.3");
  assert.equal(a.mul(b).toString(), "0.02");
  assert.equal(a.div(b, 4).toString(), "0.5");
  assert.equal(a.cmp(b), -1);
  assert.equal(Decimal.zero.toString(), "0");
  assert.equal(Decimal.fromNumber(1.5).toString(), "1.5");
});

test("fromNumber and toNumber", () => {
  assert.equal(toNumber(fromString("123.45")), 123.45);
  assert.equal(toString(fromNumber(0.1)), "0.1");
  assert.equal(toString(fromNumber(-2.5)), "-2.5");
});

test("large numbers exact", () => {
  const big = fromString("12345678901234567890.123456789");
  assert.equal(toString(big), "12345678901234567890.123456789");
  assert.equal(toString(add(big, fromString("0.000000001"))), "12345678901234567890.12345679");
});
