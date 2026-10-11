# Business Logic — Working Defaults

The open business rules from section 5 of [app-phase-one.md](app-phase-one.md), plus the settings it leaves "to be decided". The app is a demo for the owner, so these defaults count as decided until the owner says otherwise. B1–B6 decide the numbers in each sale; B8 onwards fill the gaps of the private-training model. Each one has a **working default** so the app can be built now. None of them is final.

In code, every default is marked with a comment that starts with `TODO(business-logic)` and names its section here, e.g. `TODO(business-logic): B1`. To list them all:

```sh
grep -rn "TODO(business-logic)" app
```

When the owner settles a rule, update this doc, change the code, and remove its TODO.

---

## B1. Who pays the partner?

**Default:** the partner is paid from the **platform's (Admin's) part**. The trainer always gets exactly their Trainer Share, whether or not the customer was referred.

- Trainer line = Trainer Share % of the enrollment's paid amount.
- Partner line = Partner Commission % of the paid amount (only when the order has a partner).
- Admin line = what is left.

With a 70% trainer share and a 10% partner commission, a 100 enrollment splits like the example in 3.11: Trainer 70, Admin 20, Partner 10. Without a partner: Trainer 70, Admin 30.

**Why:** the trainer can't control who brings the customer, so their income shouldn't change with it. Bringing in customers is a marketing cost, which is the platform's to carry.

## B2. Where is the split configured?

**Default:**

- **Trainer Share** is per course (the existing field), pre-filled from the platform default of **70%**. The Admin can change it during review.
- **Partner Commission** is one global platform setting of **10%**. There is no per-partner rate in phase one.
- The Admin's part is never configured. It is always the remainder.

**Why:** trainers (the head trainer, his assistants, and later others) earn differently from course to course; partners all get the same simple deal until there's a reason not to.

## B3. How is partner commission calculated?

**Default:** a **percentage of each enrollment's paid amount**, on **every** paid purchase of a referred customer, for as long as they are attributed (no attribution window, since attribution is permanent).

- A partner earns only if they are **active** when the order is placed. If the partner is inactive, the order gets no partner snapshot and the commission stays with the Admin.

**Why:** a percentage scales with price and discounts without extra rules, and "every purchase" is the simplest rule to explain to partners.

## B4. Who absorbs discounts?

**Default:** **every share shrinks proportionally.** All percentages are applied to the enrollment's **paid amount** (after its part of the discount), never to the list price.

- The Admin's line can never be negative. To guarantee that, a course's Trainer Share must be at most `100 − Partner Commission` (90% with the defaults). The course form and the split code both enforce it.
- An enrollment with a paid amount of **0** (a 100% discount) creates **no purchase transaction**, since lines can't be 0. The enrollment is still created.

**Why:** it's the only rule that needs no special cases, and it can't create a negative line.

## B5. How are partial refunds split?

**Default:** a **proportional mirror**. The customer gets the refund amount back, and every other line of the purchase transaction gives back the same fraction of what it received.

Example: a 50% refund of the 100 enrollment in 3.11 → Customer +50, Trainer −35, Admin −10, Partner −5.

A full refund is the exact mirror, as the spec already says.

## B6. Rounding

Money is stored in integer Rial, so percentages need a rounding rule. **Default:**

- **Split and partial refunds:** the trainer and partner lines are rounded **down**. The Admin line takes the remainder, so the lines always add up to 0 and the platform absorbs any rounding.
- **Refund amount:** `floor(paid amount × refund %)`, where B11 decides the refund % from the held sessions.
- **Fixed-amount discounts** across items: each item gets `floor(discount × item price ÷ subtotal)`, and the leftover Rial go one each to the items with the largest rounding remainders.

## B7. Settings left "to be decided"

| Setting                   | Default                         |
| ------------------------- | ------------------------------- |
| Default trainer share     | 70% (B2)                        |
| Partner commission        | 10% (B2, new setting)           |
| Minimum withdrawal amount | 1,000,000 Rial (۱۰۰ هزار تومان) |
| OTP requests per phone    | 5 per hour                      |
| OTP requests per IP       | 20 per hour                     |
| Late session cancellation | 24 hours before (B11)           |
| Test refund cut-off       | 24 hours before (B12)           |
| Behavior plan validity    | 7 days (B13)                    |
| Behavior video size limit | 100 MB per video, up to 3 (B15) |

All of these belong in Platform Settings (entity 25), so the Admin can change them without a release. The numbers above are their initial values.

---

## B8. Is the head trainer the Admin? (spec 5.6)

**Default:** **separate accounts.** The owner signs in as Admin; the head trainer has a Trainer account with "Is Head Trainer" set. If they are the same person, he uses two phone numbers until accounts can hold two roles.

**Why:** it keeps "one role per phone number", which the guards and layouts rely on, and the earnings of the trainer stay visible apart from the platform's share.

## B9. Group courses (spec 5.7)

**Default:** **none.** Every enrollment is one dog with one trainer.

**Why:** the owner described the work as hiring a private tutor. Group courses would bring back runs, seats and minimums; add them only when the owner asks for a real group course.

## B10. Pay first, schedule after (spec 5.8)

**Default:** the customer **pays when booking**, and the enrollment waits in `Scheduling` while the trainer arranges the first session. If the trainer can't take it, the Admin cancels it with a **full refund**.

**Why:** booking then feels like hiring someone, with no "wait for approval" step, and the refund path already exists. With one trainer, the risk of a booking he can't take is small and visible on his dashboard.

## B11. Refunds without a start date (spec 5.9)

**Default:**

- **Before the first session is held:** full refund, whatever the policy.
- **After:** `paid amount × unheld sessions ÷ planned sessions × the policy's refund %`, where held sessions are `Held` plus `Missed`. Presets: Flexible 100%, Moderate 50%, Strict 0%.
- **Trainer or Admin cancels:** `paid amount × unheld sessions ÷ planned sessions`, ignoring the policy.
- A session the customer cancels **less than 24 hours** before it starts is marked `Missed`.
- Changing an enrollment's planned sessions changes the refund math from then on; the trainer sees the effect before saving.

**Why:** with private sessions, what the customer has used up is the sessions, not the days since a start date.

## B12. Tests (spec 5.10)

**Default:** each course with a test has its own **test price** on the course. Any trainer can run it. Full refund until **24 hours** before the test session, none after. A failed test can be bought again.

**Why:** it reuses the enrollment machinery (one session and a result) instead of a new kind of product.

## B13. Behavior plans (spec 5.11)

**Default:** the trainer **proposes sessions and a price per request**. The plan can be paid for **7 days**. After that it expires, and the customer can send a new request.

**Why:** behavior problems vary too much for a fixed length, and the courses doc gives none. The trainer has seen the video before he names a price.

## B14. Boarding (spec 5.12)

**Default:** an optional **fixed add-on per course** (the course's Boarding Price), added to the order item's price. A course without a Boarding Price shows boarding as "price on request" and the booking can't choose it online.

**Why:** a fixed add-on keeps checkout and refunds simple. Per-day pricing can come later if the owner prices boarding that way.

## B15. Behavior request videos (spec 5.17)

**Default:** up to **3 videos**, **100 MB** each, in common phone formats (mp4, mov). They are stored in object storage as uploaded, with no transcoding, and only the customer, trainers and the Admin can see them.

**Why:** a phone clip of a minute or two fits easily; transcoding can wait until videos are shown anywhere public.

## B16. CGC and BMC "for every dog" (spec 5.14)

**Decided:** the site **never states** these as rules, and neither is a prerequisite. They are part of the process: after an assessment, the trainer's recommendations start pre-filled with **CGC** (if the dog hasn't passed it or its test) and **BMC** (if the dog is, or soon will be, 6–7 months old and hasn't taken it). The trainer can remove them. BMC's age range is **6 to 7 months**, as on the course card, and is enforced.

**Why:** the owner steers every dog to them through the trainer instead of a rule on the page, which would read as pressure.

## B17. Not in phase one

- **Paid assessments** (spec 5.13): only the free assessment exists until the paid types are defined.
- **Installments** (spec 5.16): the gateway takes the full amount.
- **Catalog gaps** (spec 5.15): courses with missing details (working and sport dogs) are published without online booking; their page asks for a free assessment instead. Advanced has **no prerequisite** until the owner says otherwise.
