# Phase One — Pages

Pages needed for phase one, from [app-phase-one.md](app-phase-one.md). The section numbers in parentheses point to that spec.

## Quick List

**Public**

1. Home
2. Course Catalogue
3. Course Detail
4. Trainer Profile
5. Login / Register (OTP)

**Customer**

6. Customer Dashboard
7. Pets List
8. Pet Form (add / edit)
9. Pet Detail and Progress
10. Checkout
11. Payment Result
12. My Reservations
13. Reservation Detail
14. My Waitlist
15. My Orders
16. Write Review

**Shared (Customer, Trainer, Partner)**

17. Profile Settings
18. Wallet
19. Withdrawal Request

**Trainer**

20. Trainer Dashboard
21. My Courses
22. Course Form (create / edit / resubmit)
23. Review Changes (Admin changes to confirm)
24. My Runs
25. Run Form (create / relaunch)
26. Run Detail (reservations and results)
27. Comments to Reply
28. Earnings

**Partner**

29. Partner Dashboard
30. Referral Link and QR Code
31. Referred Customers
32. Leads

**Admin**

33. Admin Dashboard
34. Users
35. User Detail / Form
36. Courses
37. Course Review
38. Runs
39. Run Detail
40. Orders
41. Order Detail
42. Payments
43. Transactions
44. Transaction Form (new / mirror)
45. Wallets
46. Withdrawal Queue
47. Discount Codes
48. Discount Code Form
49. Refund Policies
50. Comments Moderation
51. Partners and Leads
52. Platform Settings

---

## Notes

### Public

- **Home:** featured courses and upcoming runs. Stores the referral code from the link or QR (3.11).
- **Course Catalogue:** course cards with filters (category, level, species, city).
- **Course Detail:** content, rating, upcoming runs with seats and "remaining to start", reserve or join the waitlist, comments, questions and reviews (3.3, 3.12).
- **Trainer Profile:** bio, verified badge, rating, courses.
- **Login / Register:** phone number, then 5-digit code with resend timer (2).

### Customer

- **Pet Detail:** passed courses, enrollments, trainer notes.
- **Checkout:** pick pets, eligibility and retake notices, discount code, wallet use, 15-minute hold timer (3.3, 3.5, 3.7, 3.9). Also used for waitlist offers (3.4).
- **Payment Result:** gateway callback page, success or failure with retry.
- **Reservation Detail:** run info, refund amount preview, cancel (3.6).
- **My Waitlist:** entries, active offers with countdown, leave.

### Shared

- **Wallet:** balance, pending withdrawal, own transaction lines (3.9).
- **Withdrawal Request:** amount, Sheba, holder name, cancel pending (3.10).

### Trainer

- **Course Form:** read-only for Admin-only fields after approval; shows rejection reason (3.2).
- **Review Changes:** old and new value per field, Admin note, accept or edit (3.2).
- **Run Detail:** reservations with pet notes, attendance, pass/fail result and trainer note per pet (3.3).
- **Earnings:** earning per run (3.8).

### Partner

- **Referred Customers:** signup date, paid orders, total spend, date filter (3.11).
- **Leads:** add a phone number, lead status.

### Admin

- **Users:** create trainers and partners, change role, block.
- **Course Review:** approve, reject, edit then send back or force approve, archive, change owner (3.2).
- **Run Detail:** edit locked fields, cancel with reason, reassign trainer (3.3).
- **Payments:** read-only log (entity 15).
- **Transactions:** all transactions, mirror warning (3.9).
- **Wallets:** system and user wallets, negative balances list.
- **Withdrawal Queue:** oldest first, over-72-hours highlight, approve with tracking code or decline (3.10).
- **Comments Moderation:** approve, reject, hide, restore, reply (3.12).
