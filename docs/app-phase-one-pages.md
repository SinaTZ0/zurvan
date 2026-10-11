# Phase One — Pages

Pages needed for phase one, from [app-phase-one.md](app-phase-one.md). The section numbers in parentheses point to that spec.

**Before building pages**, finish [foundations-plan.md](foundations-plan.md) (auth and roles, schema and money core, slot booking and jobs, shared helpers, seed data). Open business rules use the working defaults in [business-logic.md](business-logic.md), and images follow [media.md](media.md).

## Quick List

**Public**

1. Home
2. Course Catalogue
3. Course Detail
4. Trainer Page
5. Book a Free Assessment
6. Behavior Modification Request
7. Login / Register (OTP)

**Customer**

8. Customer Dashboard
9. Dogs List
10. Dog Form (add / edit)
11. Dog Detail and Record
12. Book a Course or Test
13. Checkout
14. Payment Result
15. My Training (enrollments)
16. Enrollment Detail
17. My Assessments
18. My Behavior Requests
19. My Orders
20. Write Review

**Shared (Customer, Trainer, Partner)**

21. Profile Settings
22. Wallet
23. Withdrawal Request

**Trainer**

24. Trainer Dashboard
25. Schedule (assessment slots and sessions)
26. Assessment Detail
27. Enrollments
28. Enrollment Detail (sessions and result)
29. Behavior Requests
30. Behavior Request Detail
31. Comments to Reply
32. Earnings

**Partner**

33. Partner Dashboard
34. Referral Link and QR Code
35. Referred Customers
36. Leads

**Admin**

37. Admin Dashboard
38. Users
39. User Detail / Form
40. Courses
41. Course Form
42. Assessments
43. Enrollments
44. Enrollment Detail
45. Behavior Requests
46. Orders
47. Order Detail
48. Payments
49. Transactions
50. Transaction Form (new / mirror)
51. Wallets
52. Withdrawal Queue
53. Discount Codes
54. Discount Code Form
55. Refund Policies
56. Comments Moderation
57. Partners and Leads
58. Platform Settings
59. SMS Outbox (showcase mode)

---

## Notes

### Public

- **Home:** built around the head trainer: who he is, problems in the owner's words leading to courses, the catalog on a ruler of the dog's age, how starting works. The main action is the free assessment. Stores the referral code from the link or QR (3.14).
- **Course Catalogue:** courses by family (3.1), with age, sessions and place. Filters: family, the dog's age, place.
- **Course Detail:** commands, age, sessions, place, prerequisites, price, refund policy, comments, questions and reviews (3.15). The action depends on the visitor: a new dog gets "book a free assessment", a dog with a record gets "book this course", a course with a test also offers the test, and behavior modification gets "send a request".
- **Trainer Page:** the head trainer's bio, years, certificates, photos, rating and reviews. Mentions the assistant.
- **Book a Free Assessment:** pick or add a dog, training goal, what to change, place, then an open slot (3.3). Asks to sign in first.
- **Behavior Modification Request:** dog, problem category, description, video upload (3.7). Asks to sign in first.
- **Login / Register:** phone number, then 5-digit code with resend timer (2).

### Customer

- **Dog Form:** every field of entity 4: name, breed, sex, birth date (approximate is fine), weight, neutered, photo, microchip number, vaccination status, behavior notes and medical notes. Say that the two notes are shown to the trainer. The current `pets` page (name, species, breed, age in years) is replaced by this.
- **Dog Detail and Record:** assessments with the trainer's notes and recommendations (each with "book"), enrollments with results, passed tests, trainer notes. This is where a dog with a record books its next course.
- **Book a Course or Test:** dog (with eligibility and retake notices), boarding, address, preferred times, training goal (3.4, 3.8). Leads to checkout.
- **Checkout:** items, discount code, wallet use (3.10, 3.12). Also used to pay a behavior plan (3.7).
- **Payment Result:** gateway callback page, success or failure with retry. For the showcase there is no gateway: "pay" always succeeds and lands here (see [foundations-plan.md](foundations-plan.md)).
- **Enrollment Detail:** session schedule with places and notes, held count, result, refund amount preview, cancel (3.5, 3.9).
- **My Assessments:** upcoming and past, cancel an upcoming one (3.3).
- **My Behavior Requests:** status, the trainer's plan with its expiry, pay or withdraw (3.7).

### Shared

- **Wallet:** balance, pending withdrawal, own transaction lines (3.12).
- **Withdrawal Request:** amount, Sheba, holder name, cancel pending (3.13).

### Trainer

- **Trainer Dashboard:** today's sessions and assessments, enrollments waiting to be scheduled, new behavior requests.
- **Schedule:** a week view of the trainer's assessment slots and sessions. Open slots (one or repeating), close a slot, warnings on overlaps (3.3, 3.5).
- **Assessment Detail:** dog with its notes, customer's note and place, mark completed or no-show, write notes, pick recommended courses, mark a dog as already known (3.3).
- **Enrollment Detail:** dog with its notes, customer's preferred times and address, schedule and reschedule sessions, mark held or missed, session notes, change the planned count, record the result (3.4, 3.5).
- **Behavior Request Detail:** videos, description, propose a plan or decline (3.7).
- **Earnings:** earning per enrollment (3.11).

### Partner

- **Referred Customers:** signup date, paid orders, total spend, date filter (3.14).
- **Leads:** add a phone number, lead status.

### Admin

- **Users:** create trainers and partners, change role, block. Pick the head trainer.
- **Course Form:** every field of entity 5, prerequisites, publish and archive (3.2).
- **Enrollment Detail:** reassign trainer, cancel with reason and refund (3.9).
- **Payments:** read-only log (entity 16).
- **Transactions:** all transactions, mirror warning (3.12).
- **Wallets:** system and user wallets, negative balances list.
- **Withdrawal Queue:** oldest first, over-72-hours highlight, approve with tracking code or decline (3.13).
- **Comments Moderation:** approve, reject, hide, restore, reply (3.15).
- **SMS Outbox:** in showcase mode, every SMS the app would have sent (3.16).
