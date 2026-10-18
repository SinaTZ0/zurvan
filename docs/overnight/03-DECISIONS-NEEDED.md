# Decisions needed

Facts only the owner or the client has. Each one says what the site does **until** it is decided, so nothing is faked in the meantime. Nothing here was invented overnight.

## Legal text and consent

| Needed                                                                                    | Blocks                                                                                                                                                                               | Safe interim behaviour                                                                                              |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| The site rules («قوانین»), approved wording                                               | The «قوانین» page and nav link, the consent tick at sign-up                                                                                                                          | No rules page, no tick, nothing recorded. The consent storage is built and switches on when a rules version is set. |
| Program-specific terms for a course                                                       | The terms step at checkout                                                                                                                                                           | Not shown; checkout does not pretend terms were accepted.                                                           |
| Publication consent for a dog's public logbook and for photos or videos                   | Any public media                                                                                                                                                                     | Logbooks are private by default; public media does not exist.                                                       |
| **Two sentences on the privacy page** changed for accuracy, **please review the wording** | «رمز عبور نداریم» was false once passwords existed; it now says a password, if set, is stored only as a hash, and that wrong-password attempts are kept for a day (the «ورودها» row) | Live on the branch only.                                                                                            |

## Sign-in

- **Password reset design (my choice, please confirm).** Reset is «sign in with a code, then set a new password»; the card asks for no current password; a password can only be set within 30 minutes of signing in; setting it signs the other devices out; five wrong passwords in 15 minutes pause password sign-in for that number (the code still works). This is as strong as the SMS channel. **While the code is the public `12345` it is not strong at all**, and nothing in the code can fix that: a real SMS provider is the decision.

## Home page and mascot

- **New H1 for the home page.** «من فقط فرمان نمی‌برم؛ می‌فهمم.» is not approved as final but is still live, since the owner said they would supply the line. Proposals only, in the owner's tone (informal, warm): «با هم یاد می‌گیریم، من و تو.» · «بذار با هم حرف همدیگه رو بفهمیم.» · «من اینجام که تو رو بفهمم.»
- **Authentic Zurvann art** and approval of the growth-stage plan and dialogue in `05-MASCOT-SPEC.md`.

## Courses, eligibility and money

- **Early-age exception** (2 to 3 months old dogs of non-working breeds may take one of three introductory courses without an assessment): the exact age bounds, the **three course ids** and the **excluded working breeds**. Interim: the rule is built, configurable and **off**; with nothing configured every dog needs the assessment (fail closed).
- **The assessment questionnaire** (the form the owner fills in before the trainer evaluates). Interim: the existing free-evaluation request (dates, available days, photos, videos) stays; no new questions were invented.
- **Prices** for sport and working courses, and a **bundle discount**. Interim: courses without a verified price are not sold online; no bundle is shown.
- **Deposit.** The brief mentions 50 percent. Interim: the deposit percentage is a setting that defaults to **100** (pay in full), so nothing changes until the owner sets it.
- **Refund, cancellation and trainer-reassignment terms.** Interim: the refund ledger records what the Admin decides; the site states no policy.
- **Which delivery formats each course offers** (private at the client's place, private at the centre, group at the centre, boarding) and whether format changes the price. Interim: formats are stored as their own field; a course with none configured says the format is arranged with the trainer.
- **Session counts.** Course pages keep the catalogue's approximate counts («حدوداً N جلسه», or «بعد از ارزیابی»); they are the catalogue's numbers, not checked per dog. The course page now says «به سگ و نوع دوره بستگی داره.» under the count, and the FAQ says the same. Confirm the numbers or remove them.

## Logbook and certificate

- **Public by default?** The client wants public histories unless hidden; the brief says privacy first. Interim: private by default, public only after the owner of the dog opts in and the opt-in is recorded with a time (revocable).
- **Certificate wording, signatory and issuance requirements.** Interim: the Admin records a certificate for a **completed** enrollment; the verification page states only the number, dog, course and date.
- **Who may write logbook entries.** Only the head trainer exists as staff; no other trainer role was invented.

## Partners

- **Commission rules** (percentage, trigger, settlement). **The site already earns a 10% commission at a customer's first paid purchase and the Admin pays it by hand;** that is the demo's existing behaviour and was left exactly as it was, but it is not an approved commercial rule. Set the percentage to 0 in the Admin settings if it should not run until the rules exist.
- **May partners register customers and dogs on their behalf, and see a dog's progress?** A privacy and consent question. Interim: partners see the status and commission of their own referrals read-only; no partner-side registration; no dogs or progress.
- **Commercial-partner logos and contracts.** Interim: no logo is shown.

## Contact, brand and language

- **Second phone number** and **WhatsApp number or link.** Not in the data; nothing was guessed.
- **Site slogan.** `EXPERIENCE. KNOWLEDGE. RESULT.` is recorded from the card but **not** put on the site.
- **«آموزش K9» in 31 page titles and descriptions and 9 SMS and sign-in messages.** The logo and footer already say «زروان». Replacing it is a naming decision.
- **English/Persian switcher.** Today: `lang="fa" dir="rtl"`, every string hard-coded Persian, no i18n library. Proposed stages: (1) pull strings out for the pages that matter most (home, courses, help, sign-in), (2) translate and have a person review them, (3) add `/en/…` URLs with the language remembered in a cookie, (4) only then show the switcher. Legal text is translated last, by a professional. No switcher ships before stage 2.
- **Other species.** The account stays dog-only until the owner decides.
- **Dog profile fields** (F2 is still «pending the owner»): nothing was added.

## Articles

- **Article search.** There is no article feature. The behaviour the owner described («ادرار هیجانی» finding matches or a truthful empty state) needs the feature first.
