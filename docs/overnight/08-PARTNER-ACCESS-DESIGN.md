# Partner access and data privacy: design

Written 2026-10-19 from the owner's notes (rows 46, 47, 48 and 49 of the feedback checklist). **A design, not a feature:** the first part is what already ships (and is checked by tests); the second is what a partner could additionally see, and it is **not built** because it needs wording and scope that only the owner can approve. Nothing here asks to publish a person's data.

## 1. What a partner sees today (built, tested, and now stated truthfully on `/privacy`)

For **their own referrals only**, that is, a person attributed to this partner at sign-up by the partner's link or code, or by a phone number the partner typed as a lead (app-spec F7):

| Shown                                                                                 | Where in the code                                            |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| The number the partner typed, and once registered the customer's name                 | `account_partner_leads/components/lead-row.tsx`              |
| Where the person stands: lead, registered, bought, lost                               | `account_partner_leads/stages.ts`                            |
| For someone who bought: the **commission** (amount) and whether the Admin has paid it | `PartnerPerson.commission` in `app/orpc/partner/contract.ts` |

**Never shown:** a dog, an evaluation, the training diary, a purchase, its price or its course (a commission at 10% does reveal roughly a first purchase's size; the privacy page now says the partner sees the commission), another partner's people, the customer's other data. Isolation is checked by the partner integration test «a referral link beats a lead, and a partner never sees the other's customers» (`app/orpc/partner/integration.test.ts`). The privacy page's partner card and the sign-up page's one-line note say exactly this list.

## 2. What the owner asked

- **Row 46.** The nav item is called «همکارها» (done), the partner has their own sign-up and panel, can register a customer from the panel, and the referral code ends up attached to the customer.
- **Row 47.** A partner sees purchase and payment status and their commission **only for the customers they brought**, never another partner's; the owner also raised the partner seeing **a dog's training information or file**.
- **Row 49 (public file).** Only training data (name, breed, age, goal, classes passed) is ever public; the owner's name and contact stay private; the owner can make it private or withdraw it.

Unknown, and not guessed: which fields count as «training information» for a partner, the consent wording, and whether partners should see dog progress at all (the owner's own wish is not the customers' consent).

## 3. Proposed rules (for the owner's approval)

1. **Own referrals only, enforced on the server.** Every partner query joins through the attribution (`user.referredByPartnerId = <this partner>`); the client never filters. An inactive partner loses access at once.
2. **Three tiers, and only the first two ever exist for a partner.**
   - **Tier 0 (today):** the list in section 1.
   - **Tier 1 (needs the owner's wording and the customer's consent):** a customer who agrees lets the partner who brought them see, **for one dog at a time**, the dog's name, breed, age, the courses it has passed with their dates, and whether a completion certificate is valid. Nothing else.
   - **Tier 2 (never for a partner):** the owner's contact details beyond what the partner typed, the diary text, evaluation photos and videos, payment details, the purchase's price or course, anything about another customer.
3. **Consent is the customer's, per dog, versioned and revocable.** It reuses the consent record that already exists (`consent`, with the dog id, the version and the time; `app/orpc/consent`): a new kind `partner-progress`, stored as text, so **no schema change**. Taking it back is one press, takes effect at once, and the record of having agreed stays (the same rule as the public logbook, app-spec F13 and F14).
4. **Off until the wording exists.** Like the public record (`app/lib/public-record.ts`, `null`), a constant `PARTNER_PROGRESS_CONSENT = null` keeps the choice from being offered: no owner sees a tick, the API refuses to turn it on, a partner sees Tier 0 only.
5. **No existence leak.** A partner asking for a dog they may not see gets the same answer as for a dog that doesn't exist.
6. **One list, strictly typed.** The Tier 1 response is a `.strict()` schema of exactly the allowed fields, so a field added to the dog later can't reach a partner by accident.
7. **Audit.** Granting and withdrawing are `audit_event`s (the table exists), visible to the Admin.
8. **Registering a customer on someone's behalf is not proposed.** Creating an account (or a dog) for a person who has not verified their own number and agreed to anything is a consent problem. What the owner wants (the code reaching the customer) is already true two ways: the partner's link or QR carries the code, and a phone number the partner typed becomes the attribution when that person signs up (the earliest lead wins; an inactive partner attributes no one). A partner-side «invite by SMS» could be added later without creating anything on the person's behalf.

## 4. Acceptance criteria and tests to write when it is built

- A partner never receives another partner's customer in any procedure (unit and integration test over two partners).
- A dog without a `partner-progress` consent for the **current version** is `NOT_FOUND` for its partner, indistinguishable from a missing dog.
- Withdrawing the consent removes access in the next request.
- A deactivated partner gets nothing, with or without consent.
- The response contains exactly the Tier 1 fields (a contract test that fails if a field is added).
- The owner's dog page shows the choice only when the owner has an attributed partner **and** `PARTNER_PROGRESS_CONSENT` is set.
- The privacy page's partner card and the consent text are changed in the same commit as the behaviour.

## 5. Draft wording, **not approved and not shipped**

A starting point for the owner to edit (it would be the `paragraphs` of the constant above):

> «همکاری که تو را به زروان آورده می‌تواند پیشرفت آموزشی سگت را ببیند: اسم و نژاد و سن سگ، دوره‌هایی که گذرانده و این‌که گواهی پایان دوره معتبر است یا نه. اسم و شماره‌ی تو، عکس و فیلم‌ها، یادداشت‌های جلسه‌ها و پرداخت‌هایت هرگز به او نشان داده نمی‌شود. هر وقت خواستی با یک کلیک اجازه را پس بگیر؛ از همان لحظه دیگر چیزی نمی‌بیند.»

## 6. Decisions for the owner

1. Should a partner ever see a dog's progress? If not, row 47's second sentence is answered and nothing more is built.
2. If yes: the Tier 1 field list above, and the wording in section 5 (edit it).
3. Whether partners may be told, at sign-up, that a customer chose to share (today the customer's own page says so; the partner sees the dog only after consent).
