# Business Logic — Working Defaults

The open business rules from section 5 of [app-phase-one.md](app-phase-one.md), plus the settings it leaves "to be decided". Each one has a **working default** so the app can be built now. None of them is final.

In code, every default is marked with a comment that starts with `TODO(business-logic)` and names its section here, e.g. `TODO(business-logic): B1`. To list them all:

```sh
grep -rn "TODO(business-logic)" app
```

When the owner settles a rule, update this doc, change the code, and remove its TODO.

---

## B1. Who pays the partner?

**Default:** the partner is paid from the **platform's (Admin's) part**. The trainer always gets exactly their Trainer Share, whether or not the customer was referred.

- Trainer line = Trainer Share % of the seat's paid amount.
- Partner line = Partner Commission % of the paid amount (only when the order has a partner).
- Admin line = what is left.

With a 70% trainer share and a 10% partner commission, a 100 seat splits like the example in 3.8: Trainer 70, Admin 20, Partner 10. Without a partner: Trainer 70, Admin 30.

**Why:** the trainer can't control who brings the customer, so their income shouldn't change with it. Bringing in customers is a marketing cost, which is the platform's to carry.

## B2. Where is the split configured?

**Default:**

- **Trainer Share** is per course (the existing field), pre-filled from the platform default of **70%**. The Admin can change it during review.
- **Partner Commission** is one global platform setting of **10%**. There is no per-partner rate in phase one.
- The Admin's part is never configured. It is always the remainder.

**Why:** trainers negotiate their share course by course; partners all get the same simple deal until there's a reason not to.

## B3. How is partner commission calculated?

**Default:** a **percentage of each seat's paid amount**, on **every** paid purchase of a referred customer, for as long as they are attributed (no attribution window, since attribution is permanent).

- A partner earns only if they are **active** when the order is placed. If the partner is inactive, the order gets no partner snapshot and the commission stays with the Admin.

**Why:** a percentage scales with price and discounts without extra rules, and "every purchase" is the simplest rule to explain to partners.

## B4. Who absorbs discounts?

**Default:** **every share shrinks proportionally.** All percentages are applied to the seat's **paid amount** (after its part of the discount), never to the list price.

- The Admin's line can never be negative. To guarantee that, a course's Trainer Share must be at most `100 − Partner Commission` (90% with the defaults). The course form and the split code both enforce it.
- A seat with a paid amount of **0** (a 100% discount) creates **no purchase transaction**, since lines can't be 0. The enrollment is still reserved.

**Why:** it's the only rule that needs no special cases, and it can't create a negative line.

## B5. How are partial refunds split?

**Default:** a **proportional mirror**. The customer gets the refund amount back, and every other line of the purchase transaction gives back the same fraction of what it received.

Example: a 50% refund of the 100 seat in 3.8 → Customer +50, Trainer −35, Admin −10, Partner −5.

A full refund is the exact mirror, as the spec already says.

## B6. Rounding

Money is stored in integer Rial, so percentages need a rounding rule. **Default:**

- **Split and partial refunds:** the trainer and partner lines are rounded **down**. The Admin line takes the remainder, so the lines always add up to 0 and the platform absorbs any rounding.
- **Refund amount:** `floor(paid amount × refund %)`.
- **Fixed-amount discounts** across items: each item gets `floor(discount × item price ÷ subtotal)`, and the leftover Rial go one each to the items with the largest rounding remainders.

## B7. Settings left "to be decided"

| Setting                   | Default                         |
| ------------------------- | ------------------------------- |
| Default trainer share     | 70% (B2)                        |
| Partner commission        | 10% (B2, new setting)           |
| Minimum withdrawal amount | 1,000,000 Rial (۱۰۰ هزار تومان) |
| OTP requests per phone    | 5 per hour                      |
| OTP requests per IP       | 20 per hour                     |

All of these belong in Platform Settings (entity 24), so the Admin can change them without a release. The numbers above are their initial values.
