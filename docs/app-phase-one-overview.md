# Phase One — Overview

A short version of [app-phase-one.md](app-phase-one.md). Read this first. Go to the full spec for exact rules, edge cases and entity fields.

## What it is

An online shop for **pet training courses**. Customers reserve a seat for their **pet** in a scheduled class, and pay online or from their in-app wallet. Trainers run the courses and get a share of each sale. Partners (pet shops, clinics, groomers) bring in customers through referral links and get a commission.

The site is in Persian. Everyone signs in with their **phone number and an SMS code**.

## Roles

| Role         | Does                                                                                     |
| ------------ | ---------------------------------------------------------------------------------------- |
| **Admin**    | The owner. Manages everything, approves courses, handles money and withdrawals.          |
| **Trainer**  | Creates courses (needs Admin approval), schedules classes, records each pet's result.    |
| **Partner**  | Shares a referral link or QR code, sees referred customers and their commission.         |
| **Customer** | Adds pets, reserves and pays, follows each pet's progress, writes reviews and questions. |

Only customers can sign up themselves. The Admin creates trainers and partners.

## Courses and runs

- A **course** is the curriculum: what's taught, for which pets, and what they must have passed first. The Admin approves it once.
- A **run** is one scheduled class of a course: trainer, dates, place, price and number of seats. A course can have many runs, and trainers can relaunch one in a click without new approval.
- Pets **enroll in a run** but **pass a course**. Passing any run of a course counts as its prerequisite.

A run only happens if enough pets reserve it:

```text
Draft → Published → Confirmed (minimum reached) → In Progress → Completed
            ↓              ↓
        Cancelled (minimum not reached by the deadline, or Admin cancels)
```

## Reserving a seat

1. The customer picks a run and a pet. The pet must meet the course's prerequisites, species and age rules.
2. The seat is held for **15 minutes** while they pay. A run can **never be overbooked**, even when many people book at once.
3. When a run is full, customers can join a **waitlist**. If a seat frees up, the next pet in line gets a 12-hour offer by SMS.
4. Discount codes can be applied at checkout.

**Cancelling:** each course has a refund policy (e.g. full refund until 7 days before the start, 50% after that). Cancelling before the run is confirmed, or when the platform cancels the run, always gives a full refund. Refunds go to the customer's wallet.

## Money

All money in the app is tracked as **transactions between wallets**. The app never sends real money by itself: card payments come in through the payment gateway, and the owner pays people from their own bank app and records it here.

**Wallets.** Every customer, trainer and partner has one. There are also four system wallets: **Admin** (the owner), **Gateway** (card payments in), **Bank** (payouts out) and **Withdrawal Hold**. Any wallet can go negative. The owner settles that with the user outside the app.

**Transactions.** A transaction is a list of lines, each with a wallet and an amount. Negative lines send, positive lines receive, and **the lines always add up to 0**. Transactions are never edited or deleted.

**A sale** creates one transaction per purchased seat. Its **refund** is the mirror, with every sign flipped:

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

- After a run is completed, the customer can rate the course and the trainer (1–5) and leave a comment.
- Anyone logged in can ask a question on a course page. Customer comments appear after Admin approval. Trainers and the Admin can reply.

## Still open

These business rules decide the numbers in each sale transaction and aren't settled yet (see section 5 of the full spec):

1. Is the partner paid from the trainer's part or the Admin's part?
2. Is the split set per course or globally?
3. How is partner commission calculated: fixed or percentage, every purchase or only the first?
4. Which shares shrink when a discount is used?
5. How is a partial refund (e.g. 50%) split between the wallets?
