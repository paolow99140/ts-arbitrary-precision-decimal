# ts-arbitrary-precision-decimal

Performs arbitrary-precision decimal arithmetic on numbers represented as digit arrays for exact financial calculations.

```js
import { Decimal } from "ts-arbitrary-precision-decimal";

const a = Decimal.fromString("0.1");
const b = Decimal.fromString("0.2");
const sum = a.add(b);
console.log(sum.toString()); // "0.3"

const product = a.mul(b);
console.log(product.toString()); // "0.02"

const quotient = Decimal.fromString("1").div(Decimal.fromString("3"), 5);
console.log(quotient.toString()); // "0.33333"
```

## Why this library exists

Floating-point numbers cannot represent most decimal fractions exactly. For example, `0.1 + 0.2` evaluates to `0.30000000000000004` in JavaScript. Financial calculations require exact decimal results, so this library stores numbers as arrays of decimal digits and implements arithmetic manually. The trade-off is speed and memory: operations are slower than native floating-point and the representation is larger, but the results are exact.

## API

The library exports both a `Decimal` class and a set of pure functions that operate on the internal representation. The class is the primary interface.

- `Decimal.fromString(str)` — create a decimal from a string.
- `Decimal.fromNumber(n)` — create a decimal from a number (may lose precision; prefer `fromString`).
- `Decimal.zero` — the zero decimal.
- `decimal.add(other)` — addition.
- `decimal.sub(other)` — subtraction.
- `decimal.mul(other)` — multiplication.
- `decimal.div(other, precision = 20)` — division with a fixed number of decimal places, rounding half up.
- `decimal.cmp(other)` — comparison, returns `-1`, `0`, or `1`.
- `decimal.abs()` — absolute value.
- `decimal.neg()` — negation.
- `decimal.isZero()` — true if the value is zero.
- `decimal.toString()` — decimal string representation.
- `decimal.toNumber()` — convert to a JavaScript number (may lose precision).

The pure functions `fromString`, `toString`, `fromNumber`, `toNumber`, `add`, `sub`, `mul`, `div`, `cmp`, `abs`, `neg`, and `isZero` are also exported. They operate on the internal `{ sign, digits, scale }` representation. Most users should use the `Decimal` class.

## Edge cases

Division may not terminate in decimal (for example, `1 / 3`). The `div` method requires a precision argument (default 20) and rounds half up. Division by zero throws an `Error`. The internal representation normalizes away leading and trailing zeros, so `Decimal.fromString("0.10")` and `Decimal.fromString("0.1")` compare equal and print as `"0.1"`.

## Performance

The window keeps a bounded buffer, so `push` is constant time and memory does not
grow with the length of the stream. `peak` and `trough` are linear in the window
size, which is the trade that keeps `push` cheap.

