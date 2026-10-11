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
31. My Courses
32. Course Form (create / edit / resubmit)
33. Review Changes (Admin changes to confirm)
34. Comments to Reply
35. Earnings

**Partner**

36. Partner Dashboard
37. Referral Link and QR Code
38. Referred Customers
39. Leads

**Admin**

40. Admin Dashboard
41. Users
42. User Detail / Form
43. Courses
44. Course Review / Form
45. Assessments
46. Enrollments
47. Enrollment Detail
48. Behavior Requests
49. Orders
50. Order Detail
51. Payments
52. Transactions
53. Transaction Form (new / mirror)
54. Wallets
55. Withdrawal Queue
56. Discount Codes
57. Discount Code Form
58. Refund Policies
59. Comments Moderation
60. Partners and Leads
61. Platform Settings
62. SMS Outbox (showcase mode)

---

## Notes

### Public

- **Home:** built around the head trainer: who he is, problems in the owner's words leading to courses, the catalog on a ruler of the dog's age, how starting works. The main action is the free assessment. Stores the referral code from the link or QR (3.14).
- **Course Catalogue:** courses by family (3.1), with age, sessions and place. Filters: family, the dog's age, place.
- **Course Detail:** commands, age, sessions, place, prerequisites, price, refund policy, comments, questions and reviews (3.15). The action depends on the visitor: a new dog gets "book a free assessment", a dog with a record gets "book this course", a course with a test also offers the test, and behavior modification gets "send a request".
- **Trainer Page:** any trainer's photo, bio, years, specialties, certificates, verified badge, the courses they own, rating and reviews (3.17). The head trainer's page is the one the home page links to.
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
- **Course Form:** create, edit and resubmit; Admin-only fields are read-only after approval; shows the rejection reason (3.2).
- **Review Changes:** old and new value per field, Admin note, accept or edit (3.2).
- **Earnings:** earning per enrollment (3.11).

### Partner

- **Referred Customers:** signup date, paid orders, total spend, date filter (3.14).
- **Leads:** add a phone number, lead status.

### Admin

- **Users:** create trainers and partners, change role, block. Pick the head trainer, verify trainers.
- **Course Review / Form:** create a course directly, or review a trainer's: approve, reject, edit then send back or force approve. Archive, change the owner trainer (3.2).
- **Enrollment Detail:** reassign trainer, cancel with reason and refund (3.9).
- **Payments:** read-only log (entity 16).
- **Transactions:** all transactions, mirror warning (3.12).
- **Wallets:** system and user wallets, negative balances list.
- **Withdrawal Queue:** oldest first, over-72-hours highlight, approve with tracking code or decline (3.13).
- **Comments Moderation:** approve, reject, hide, restore, reply (3.15).
- **SMS Outbox:** in showcase mode, every SMS the app would have sent (3.16).
