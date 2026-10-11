# Phase One — Pages

Pages needed for phase one, from [app-phase-one.md](app-phase-one.md). The section numbers in parentheses point to that spec.

Public pages use the URLs the home page already links to (table in [storefront-design.md](storefront-design.md#where-it-sends-people)) and follow its look and voice.

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
8. Help and FAQ
9. Cancellation and Refund Rules
10. Privacy
11. Partner Enquiry

**Customer**

12. Customer Dashboard
13. Dogs List
14. Dog Form (add / edit)
15. Dog Detail and Record
16. Book a Course or Test
17. Checkout
18. Payment Result
19. My Training (enrollments)
20. Enrollment Detail
21. My Assessments
22. My Behavior Requests
23. My Orders
24. Write Review

**Shared (Customer, Trainer, Partner)**

25. Profile Settings
26. Wallet
27. Withdrawal Request

**Trainer**

28. Trainer Dashboard
29. Schedule (assessment slots and sessions)
30. Assessment Detail
31. Enrollments
32. Enrollment Detail (sessions and result)
33. Behavior Requests
34. Behavior Request Detail
35. My Courses
36. Course Form (create / edit / resubmit)
37. Review Changes (Admin changes to confirm)
38. Comments to Reply
39. Earnings

**Partner**

40. Partner Dashboard
41. Referral Link and QR Code
42. Referred Customers
43. Leads

**Admin**

44. Admin Dashboard
45. Users
46. User Detail / Form
47. Courses
48. Course Review / Form
49. Assessments
50. Enrollments
51. Enrollment Detail
52. Behavior Requests
53. Orders
54. Order Detail
55. Payments
56. Transactions
57. Transaction Form (new / mirror)
58. Wallets
59. Withdrawal Queue
60. Discount Codes
61. Discount Code Form
62. Refund Policies
63. Comments Moderation
64. Partners and Leads
65. Platform Settings
66. SMS Outbox (showcase mode)

---

## Notes

### Public

- **Home** (built, `/`): built around the head trainer: who he is, problems in the owner's words leading to courses, the catalog on a ruler of the dog's age, how starting works. The main action is the free assessment. Stores the referral code from the link or QR (3.14). Its content is sample data until the catalog comes from the database. Section by section in [storefront-design.md](storefront-design.md).
- **Course Catalogue** (`/courses`): courses by family (3.1), with age, sessions and place. Filters: family, the dog's age, place. The header search submits `?q=` here.
- **Course Detail** (`/courses/:slug`): commands, age, sessions, place, prerequisites, price, refund policy, comments, questions and reviews (3.15). The action depends on the visitor: a new dog gets "book a free assessment", a dog with a record gets "book this course", a course with a test also offers the test, and behavior modification gets "send a request". Working and sport dogs (`/courses/working-dogs`, `/courses/sport`) use this page too, with their branches until their details are known.
- **Trainer Page:** any trainer's photo, bio, years, specialties, certificates, verified badge, the courses they own, rating and reviews (3.17). URL `/trainers/:slug`. The head trainer's page is the one the home page's trainer section should link to.
- **Book a Free Assessment** (`/assessment`): pick or add a dog, training goal, what to change, place, then an open slot (3.3). Asks to sign in first.
- **Behavior Modification Request** (`/behavior-modification`): dog, problem category, description, video upload (3.7). Asks to sign in first.
- **Login / Register** (built, `/auth`): phone number, then 5-digit code with resend timer (2).
- **Help and FAQ, Cancellation and Refund Rules, Privacy** (`/help`, `/help/refunds`, `/privacy`): plain content pages linked from the footer. The refund rules page explains 3.9 in plain Persian.
- **Partner Enquiry** (`/join/partner`): for pet shops, clinics and groomers who want to refer customers. Partners can't sign up themselves (2), so it isn't a signup. Working default until the owner decides: a short page explaining the program, with the center's phone number to call. No form, so no new entity.

### Customer

- **Dog Form:** every field of entity 4: name, breed, sex, birth date (approximate is fine), weight, neutered, photo, microchip number, vaccination status, behavior notes and medical notes. Say that the two notes are shown to the trainer. The current `pets` page (name, species, breed, age in years) is replaced by this.
- **Dogs List:** replaces `/pets`. The home page's "book the next course" links here, since a dog's page is where a dog with a record books its next course.
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

- **The head trainer is the Admin** (business-logic B8). He uses these pages for his own teaching, linked from the Admin panel. My Courses, Course Form and Review Changes are for assistants: he edits courses from the Admin's Course Form. His pay goes to the Admin wallet, so Wallet and Withdrawal Request are for assistants too.
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
