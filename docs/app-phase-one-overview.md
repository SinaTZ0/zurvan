# Phase One — Overview

A short version of [app-phase-one.md](app-phase-one.md). Read this first. Go to the full spec for exact rules, edge cases and entity fields. The course catalog itself is in [zurvan-courses.md](zurvan-courses.md).

## What it is

The website of **K9 Training** (آموزش K9), one dog trainer's private practice. It sells **him**: customers meet him on the site, book a **free assessment** for their dog, then buy **private courses** he teaches one dog at a time, at their home or outside, with boarding as an option. They pay online or from their in-app wallet. Partners (pet shops, clinics, groomers) bring in customers through referral links and get a commission.

There are no group classes, seats or waitlists, and phase one is for dogs only.

The site is in Persian. Everyone signs in with their **phone number and an SMS code**.

## Roles

| Role         | Does                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------ |
| **Admin**    | The owner. Manages everything: the catalog, bookings, money and withdrawals.                                 |
| **Trainer**  | The head trainer and his assistant. Run assessments, schedule and record sessions, review behavior requests. |
| **Partner**  | Shares a referral link or QR code, sees referred customers and their commission.                             |
| **Customer** | Adds dogs, books assessments and courses, follows each dog's record, writes reviews and questions.           |

Only customers can sign up themselves. The Admin creates trainers and partners.

## How a dog starts

```text
New dog:        free assessment → trainer recommends courses → book a course
Dog with a record:                                             book a course directly
Behavior problem:  request with a video → trainer proposes a plan → pay
```

- **Assessment:** the trainer opens time slots; the customer picks one, says what they want to change and where to meet. A slot can be booked only once. Afterwards the trainer writes notes and recommends courses.
- **A record** means the dog has a completed assessment, has had a session, or the trainer marked it as already known.
- **Tests:** some courses can be skipped by passing their test (the Companion levels, and CGC). A passed test counts like the passed course.
- **Behavior modification:** for any age and breed. The customer picks the problem, describes it and uploads a video; the trainer proposes sessions and a price, or asks for an assessment first.

## Booking a course

1. The customer picks the course and the dog, boarding or not, the address and the times that suit them, and pays. The dog must meet the course's age and prerequisite rules.
2. The trainer schedules the sessions one by one (place and time), marks each one held or missed, and writes notes.
3. At the end the trainer records **passed** or **failed** with a note. Passing a course meets the prerequisites that need it.

```text
Scheduling → Active (first session scheduled) → Passed / Failed
     ↓           ↓
         Cancelled
```

**Cancelling:** before the first session, always a full refund. After that, the course's refund policy decides how much of the unheld sessions comes back. If the trainer or Admin cancels, the customer gets back everything for the unheld sessions. Refunds go to the customer's wallet.

## Money

All money in the app is tracked as **transactions between wallets**. The app never sends real money by itself: card payments come in through the payment gateway, and the owner pays people from their own bank app and records it here.

**Wallets.** Every customer, trainer and partner has one. There are also four system wallets: **Admin** (the owner), **Gateway** (card payments in), **Bank** (payouts out) and **Withdrawal Hold**. Any wallet can go negative. The owner settles that with the user outside the app.

**Transactions.** A transaction is a list of lines, each with a wallet and an amount. Negative lines send, positive lines receive, and **the lines always add up to 0**. Transactions are never edited or deleted.

**A sale** creates one transaction per enrollment (one course, test or behavior plan for one dog). Its **refund** is the mirror, with every sign flipped:

| Wallet   | Sale | Refund |
| -------- | ---: | -----: |
| Customer | −100 |   +100 |
| Trainer  |  +70 |    −70 |
| Admin    |  +20 |    −20 |
| Partner  |  +10 |    −10 |

- **Mistakes and changes:** the Admin can create a transaction between any wallets, or start from the mirror of an existing one. Changing a share or commission formula never changes past transactions. If the Admin wants it to apply to the past, they adjust it by hand.
- **Paying:** a positive wallet balance is used first at checkout, and the card pays the rest.
- **What users see:** their balance and their own lines, never how a payment was split.
- **Card payments** are also kept in a separate log that nobody can edit or delete.

**Withdrawal.** A user requests an amount and gives their Sheba number, and is told it takes up to 72 hours. The amount moves to the Withdrawal Hold wallet right away. The Admin then either pays it from their bank app and approves (Hold → Bank), or declines (the money goes back to the user).

## Partners

- A customer belongs to **one partner forever**, decided at signup: by the referral link or QR code, or by a phone number the partner registered in advance.
- The partner's commission is their line in each sale transaction of their customers.

## Reviews and questions

- After a course ends, the customer can rate the course and the trainer (1–5) and leave a comment.
- Anyone logged in can ask a question on a course page. Customer comments appear after Admin approval. Trainers and the Admin can reply.

## Still open

Section 5 of the full spec lists the open business rules, and [business-logic.md](business-logic.md) gives each a working default. The biggest ones:

1. How each sale is split between the trainer, the Admin and the partner, and who absorbs discounts.
2. Refunds without a start date: is "full until the first session, then by policy" right?
3. Whether the trainer should accept a booking before the customer pays.
4. Prices for tests, boarding and behavior plans.
5. Missing catalog details: working and sport dogs, Advanced's prerequisite, BMC's age range.
