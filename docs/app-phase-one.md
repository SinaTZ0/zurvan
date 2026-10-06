# Website Specification Document — Phase One

### 1. Project Objective

An e-commerce platform for selling training courses tailored to customers' pets. Customers browse courses, reserve a seat for a specific pet in a scheduled run of a course, and pay online or from their in-app wallet. A run only starts once it has enough reservations. Trainers publish their own courses (after admin approval), relaunch them as new runs whenever they like, and earn a share of each run's sales. Partners (pet shops, clinics, groomers) bring in customers through referral links and earn a commission on their purchases.

---

### 2. User Roles & Authentication

- **Roles:** Admin (Owner), Trainer, Partner, Customer.
- **Authentication:** All users register and log in via Phone Number using SMS OTP (One-Time Password).
- Each phone number has **exactly one role** in phase one.

| Role         | Main capabilities                                                                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Admin**    | Super admin. Manages everything: users, courses, runs, approvals, orders, refunds, discounts, wallets, withdrawals, earnings, commissions, comments, settings. |
| **Trainer**  | Creates own courses and submits them for approval, schedules runs, sees reservations, records each pet's result, replies to comments, sees own earnings.       |
| **Partner**  | Sees own referral link and QR code, adds pre-registration leads, views referred customers, revenue and commission.                                             |
| **Customer** | Manages own pets, reserves and pays for course runs, follows each pet's progress, asks questions, reviews courses and trainers.                                |

**OTP rules:**

- Phone numbers are normalized to one format (e.g. `09xxxxxxxxx`) before storing or matching.
- The code is 5 digits, valid for **2 minutes**, and can be resent after **60 seconds**.
- After **5 wrong attempts** the code is invalidated and the user must request a new one.
- Requests are rate-limited per phone number and per IP to prevent SMS abuse.
- Only customers can self-register. Trainer and Partner accounts are created or promoted by an Admin.
- Blocked users cannot log in.

---

### 3. Core Features & Business Logic

#### 3.1 Courses and Course Runs

The catalogue is split into two levels:

- **Course** is the curriculum: what is taught, to which pets, what they must have passed first, the refund policy, and the trainer's share. It is approved once.
- **Course Run** is one scheduled class of that course: who teaches it, when and where, how many seats, and at what price. A course can have many runs over time, including several at once (e.g. one in Tehran and one online).

Pets enroll in a **run**, but they pass a **course**. Prerequisites always point to a course, so passing any run of "اطاعت‌پذیری مقدماتی" satisfies a prerequisite on that course, no matter which run, trainer or season it was.

#### 3.2 Course Creation & Approval

- Courses can be created by both **Admins** and **Trainers**.
- Courses submitted by Trainers require **Admin approval** before they can have public runs.
- The trainer picks the course's **Refund Policy** from the presets the Admin has defined (see 3.6).
- The course's **Trainer Share** is pre-filled from the platform default (see 3.8). The trainer sees it when submitting; the Admin can change it during review like any other field.
- Courses created by an Admin are approved directly.

**Reviewing a submitted course.** The Admin can:

- **Approve** it as is.
- **Reject** it with a written reason. The trainer sees the reason, edits the course, and resubmits it.
- **Edit** any field (including the refund policy and trainer share) and then either:
  - **Send it back to the trainer for confirmation.** The trainer sees each changed field with its old and new value, plus the Admin's note. Accepting approves the course; editing it again resubmits it for approval.
  - **Force approve** it with the changes. The trainer is notified of what changed.

**After approval:**

- Trainers can still edit text and images.
- Prerequisites, target species, age range, refund policy and trainer share are Admin-only, because they change which pets can enroll, what customers are promised, or what the trainer earns. Admin edits on an approved course apply immediately, and the trainer is notified.
- An Admin can **archive** a course. Archived courses can't get new runs, but existing runs continue and passing them still counts as a prerequisite.

**Course status flow:**

```text
Draft → Pending Approval → Approved → Archived

Pending Approval → Rejected                       → (trainer edits) → Pending Approval
Pending Approval → Awaiting Trainer Confirmation → (trainer accepts) → Approved
                                                 → (trainer edits)   → Pending Approval
Pending Approval → (Admin edits + force approve)  → Approved
```

#### 3.3 Course Runs & Reservations

- A run can be created only for an **Approved** course.
- A trainer can create runs only for courses they own. The Admin can create a run for any course and assign any trainer, and can change a course's owner trainer (e.g. when a trainer leaves).
- Runs **don't need Admin approval**. A trainer can relaunch a course with one click: the new run copies the previous run's price, capacity, location and schedule note, and starts as a Draft with empty dates.
- Each run has:
  - **Capacity:** the maximum number of pets that can reserve it.
  - **Minimum to start:** the number of reservations needed for the run to go ahead.
  - **Enrollment deadline:** the last moment a seat can be reserved (defaults to the start date).
- Once a run has reservations, its price, start date, capacity and location are locked for trainers. Only an Admin can change them, and affected customers are notified by SMS.

The course page shows the course content, its rating, approved reviews and questions, and a list of upcoming runs. For each run, customers see:

- Trainer (with rating), format and location.
- Start date, estimated duration (e.g. "۶ هفته · ۱۲ جلسه") and schedule.
- Price and refund policy summary.
- How many pets have reserved.
- How many more reservations are needed for the run to start (if the minimum isn't reached yet).
- How many seats are left, or "تکمیل ظرفیت" with a "join waitlist" option when full.

**Run status flow:**

```text
Draft → Published → Confirmed → In Progress → Completed
            ↓           ↓
        Cancelled   Cancelled
```

- **Published:** visible to the public and open for reservations until the deadline or until full.
- **Confirmed:** the minimum number of reservations is reached. The run will definitely happen, and customers are notified. It stays open for reservations until full or until the deadline.
- **In Progress / Completed:** set automatically from the start and end dates, or manually by the trainer.
- **Cancelled:** if the minimum isn't reached by the enrollment deadline, the run is cancelled automatically. All paid reservations are refunded in full to the customers' wallets and customers are notified. An Admin can also cancel a run manually with a reason.

**Reservation rules:**

- A seat is held for **15 minutes** while the customer pays. If payment isn't completed, the seat is released.
- **A run must never be overbooked**, even when many customers try to reserve the last seats at the same moment (e.g. right after a popular trainer announces a run). Paid reservations, checkout holds and waitlist offers all take a seat, and taking a seat must be all-or-nothing: if two customers race for the last seat, exactly one gets it and the other is told the run is full.
- Expired checkout holds and waitlist offers free their seat automatically, without anyone having to visit the page.
- A pet can't hold active reservations in two runs of the same course at the same time.
- Cancellations and refunds follow the rules in 3.6.

#### 3.4 Waitlist

- A customer can put an eligible pet on a run's waitlist **only while the run is full and its seats are still held by `Reserved` customers who could cancel**, i.e. the run is `Published` or `Confirmed`, it hasn't started, and the enrollment deadline hasn't passed.
- Joining is free. One entry per pet per run. The customer can leave at any time.
- When a seat frees up, the first pet in line gets an **offer** by SMS. The seat is held for them for **12 hours** (or until the enrollment deadline, if sooner). If they don't pay in time, the offer moves to the next pet in line.
- Accepting an offer goes through the **normal checkout**: an order is created, discount codes and the wallet can be used, the partner is attributed, and the pet's enrollment is reserved once payment succeeds. The only difference is that the seat is already held for them. If a payment attempt fails, they can retry until the offer expires.
- When the run starts, passes its deadline, or is cancelled, all remaining entries are closed and the customers are notified.

#### 3.5 Course Prerequisites & Eligibility

- Customers enroll their specific **Pets** into course runs (not the human customer).
- A course can require passing one or more other courses as prerequisites. A prerequisite is met when the pet has **Passed** any run of the required course.
- A course can also limit eligible pets by **species** and **age range**. Age is checked against the run's start date.
- If a selected pet has not completed the prerequisite(s) or doesn't meet the eligibility rules, enrollment is disabled for that pet, and a custom explanation is displayed (written by the course creator, e.g. "لئو اول باید دوره «اطاعت‌پذیری مقدماتی» را بگذراند").
- **Retakes are allowed.** If the selected pet has already passed this course, the customer sees a notice (e.g. "لئو این دوره را قبلاً با موفقیت گذرانده است") and must confirm before continuing.
- Prerequisites can't form a cycle (course A requires B, B requires A).

#### 3.6 Cancellation & Refunds

The Admin defines a few **Refund Policy** presets, and each course uses one. Example presets:

| Preset              | Full refund until    | Then, until start | After start |
| ------------------- | -------------------- | ----------------- | ----------- |
| منعطف (Flexible)    | 3 days before start  | 50%               | 0%          |
| متوسط (Moderate)    | 7 days before start  | 50%               | 0%          |
| سخت‌گیرانه (Strict) | 14 days before start | 0%                | 0%          |

**Rules:**

- A customer who cancels **before the run is Confirmed** always gets a full refund, whatever the policy.
- After confirmation, the course's refund policy decides the amount, based on how many days are left until the start date.
- If the **platform cancels** a run (minimum not reached, or Admin cancellation), every customer gets a full refund.
- Refund percentages apply to what the customer **actually paid** for that pet's seat, after any discount.
- The policy is **copied onto each order item** at purchase time, so later changes to the course don't affect existing reservations.
- A refund is a **mirror** of the seat's purchase transaction (see 3.9): every wallet that received a share gives it back, and the money lands in the customer's **wallet** instantly. The customer can spend it on another course or withdraw it (see 3.10).
- How a partial refund (e.g. 50%) is split between the wallets is an open business question (see 5).
- The Admin can issue a manual refund of any amount by creating a transaction, optionally starting from the mirror of the purchase.

#### 3.7 Discount Codes

The Admin creates discount codes. Each code has:

- **Type and value:** a percentage (with an optional maximum discount amount) or a fixed amount.
- **Validity period:** start and end date.
- **Usage limits:** total number of uses, and uses per customer.
- **Minimum order amount** (optional).
- **Scope:** all courses, or only selected courses.
- **First order only** (optional): only for customers who have never had a paid order.

**Rules:**

- One code per order.
- A fixed-amount discount is split across the order's items in proportion to their price, so each pet's seat has a known paid amount for refunds.
- A use is counted when the order is paid. If the order is fully refunded, the use is given back.
- Which share absorbs a discount (trainer, admin or partner) is an open business question (see 5).

#### 3.8 Revenue Split

- Every **purchased unit** (one pet's seat in one run) creates one **purchase transaction** when its order is paid (see 3.9). It sends the unit's paid amount from the customer's wallet to the wallets of the run's **trainer**, the **Admin**, and the customer's **partner** (if they have one).
- How the amount is divided is an open business question (see 5). The current draft is the course's **Trainer Share** percentage.
- The transaction's lines are the permanent record of the split. Changing a course's share or the commission formula **never changes past transactions**. If the Admin wants the change to apply to past sales, they work out the difference themselves and create transactions for it (e.g. `Trainer −X, Partner +X`), or leave the past as it is.
- If the Admin reassigns a run to another trainer, past purchases stay with the original trainer. The Admin moves money between them by hand if needed.
- The trainer dashboard shows each run's earning (their lines in that run's purchase transactions, minus refunds) and their wallet history.

**Example:** a course costs 100, the Admin takes 20%, and the partner gets 10 per sale. A referred customer buys one seat:

| Wallet   | Purchase | Refund (mirror) |
| -------- | -------: | --------------: |
| Customer |     −100 |            +100 |
| Trainer  |      +70 |             −70 |
| Admin    |      +20 |             −20 |
| Partner  |      +10 |             −10 |
| **Sum**  |    **0** |           **0** |

If 10 referred customers buy, that's 10 purchase transactions like this. If one of them later cancels, only their transaction is mirrored.

#### 3.9 Wallets & Transactions

All money in the app is tracked as **transactions between wallets**. The app never moves real money by itself: card payments come in through the payment gateway, and the owner pays people from their own bank app and records it here.

**Wallets:**

- **User wallets:** every customer, trainer and partner has one, created with the account.
- **System wallets:**
  - **Admin:** the owner's wallet. It receives the platform's share of each sale.
  - **Gateway:** where online card payments come from. Its balance is minus the total received online.
  - **Bank:** where payouts go. Its balance is the total paid out from the owner's bank account.
  - **Withdrawal Hold:** money of withdrawal requests waiting for the Admin (see 3.10).
- A wallet's **balance** is the sum of its lines.
- **Any wallet can be negative.** Example: a trainer was paid out, then a customer cancelled and the trainer's share was mirrored back. The Admin has a list of negative balances, and the owner settles them with the user outside the app.

**Transactions:**

- A transaction is a list of **lines**. Each line is one wallet and a signed amount: negative lines are the **senders**, positive lines are the **receivers**. A transaction can have any number of senders and receivers.
- **The lines of a transaction always add up to 0.** Money is never created or lost inside the app, only moved, so all wallets together always add up to 0.
- A transaction's **sum** is the total of its positive lines (e.g. 100 in the example in 3.8).
- Each wallet appears at most once in a transaction.
- Transactions are created in only two ways: by the **system** (payment, purchase, automatic refund, withdrawal steps) or by the **Admin**.
- **Transactions are never edited or deleted.** A mistake is fixed with a new transaction, usually its mirror.

**Mirror:**

- Any transaction can be **mirrored**. Mirroring opens a new transaction prefilled with every line's sign flipped. The Admin can change any field before saving.
- The new transaction stores which transaction it mirrors, so the history reads "بازگشت تراکنش #۱۲۳". If a transaction was already mirrored, the Admin sees a warning but can still go ahead.
- Automatic refunds (customer cancels, run cancelled) are exact mirrors created by the system.

**Admin transactions:**

- The Admin can create a transaction between **any wallets**, user or system, with any senders and receivers and a description.
- Examples: adjusting past sales after a formula change (`Trainer −X, Partner +X`), recording money a user paid the owner directly (`Bank −X, Customer +X`), or paying a user in parts after declining their withdrawal (`User −X, Bank +X` per transfer).

**What users see:**

- Each user sees their **balance** and **their own lines**, with each transaction's description and date. They never see the other lines (e.g. a customer doesn't see how their payment was split).
- That's all users can do with the wallet, apart from paying with it at checkout and requesting a withdrawal.

**Paying for an order:**

- At checkout, a positive wallet balance is used first and the rest is paid through the gateway.
- Nothing moves until payment succeeds. Then, in **one database transaction**:
  1. If part was paid online: `Gateway −g, Customer +g`, linked to the Payment.
  2. For each purchased unit: its purchase transaction (see 3.8).
- An order paid fully from the wallet skips step 1 and is paid immediately.
- So the same balance can't be spent twice, a customer can have only **one pending order that uses wallet balance** at a time.
- Gateway payments are also logged separately as **Payments**, which are immutable (see entity 15).

#### 3.10 Withdrawal

1. Any user with a positive balance can request a withdrawal of an amount up to their balance, with a Sheba number and account holder name. The user is told it will be handled **within 72 hours**. Only one request can be pending at a time.
2. The system immediately moves the amount to the hold: `User −X, Withdrawal Hold +X`. The user sees it as "در انتظار برداشت" and can't spend it.
3. The Admin sees pending requests in a **withdrawal queue**, oldest first, with requests older than 72 hours highlighted.
4. **Approve:** the Admin pays the amount from their bank app, enters the bank tracking code, and approves: `Withdrawal Hold −X, Bank +X`.
5. **Decline** (with a note shown to the user), or the **user cancels** while it's pending: the hold transaction is mirrored and the money returns to the user's wallet. After declining, the owner can still pay the user in parts with Admin transactions (see 3.9).

The user is notified by SMS when their request is approved or declined.

#### 3.11 Partner (Affiliate) System

- Partners have a dedicated dashboard with a unique **Referral Link** and **QR Code**.
- **Dashboard Metrics:** Partners can view referred customers and the total revenue generated from their purchases, filterable by date range. Each referred customer shows signup date, number of paid orders, and total spend. The dashboard also shows the commission earned (their lines in purchase transactions, minus refunds) and their wallet.
- **Pre-registration Attribution:** Partners can enter a customer's phone number before the customer signs up. If that customer later registers without a referral link, they are automatically credited to that Partner.
- **Commission:** the partner's commission is **their line in each purchase transaction** of a referred customer (see 3.8). How it's calculated is an open business question (see 5).

**Attribution rules:**

- A customer is attributed to **one partner, permanently**, at the moment of registration.
- A referral link (or QR code) used at signup takes priority over a pre-registration lead.
- If several partners add the same phone number as a lead, the **earliest** lead wins.
- A lead can't be added for a phone number that is already registered.
- Each order stores the partner it was attributed to at purchase time, so dashboard numbers don't change retroactively.
- Only **paid** orders count toward revenue. Refunded amounts are subtracted.

#### 3.12 Reviews, Comments & Questions

**Reviews:**

- After a run is **Completed**, the customer can review it once per enrollment.
- A review has a **course rating** (1–5), a **trainer rating** (1–5), and an optional **comment**.
- Ratings count toward the averages immediately. The comment follows the comment rules below.
- Course and trainer averages and counts are shown on the course page and the trainer's profile.

**Comments and questions:**

- Any logged-in customer can post a comment or question on a course page, even before enrolling. A review's comment appears in the same list, with its ratings.
- Customer comments are shown **only after Admin approval**. The Admin can approve or reject a comment with a reason.
- The course's owner trainer, any trainer who has taught a run of it, and the Admin can **reply**. Replies are shown immediately. Replies are one level deep.
- The customer is notified when their comment gets a reply.
- The Admin can **hide** any comment or reply at any time, with a reason. Hiding a comment also hides all its replies. A hidden comment can be restored.
- Comments show the customer's first name, and the pet's name when there is one (e.g. "سارا، همراه لئو").

---

### 4. Database Entities & Relationships

#### Shared conventions

These apply to every entity and are not repeated in each table:

- **ID:** UUID primary key.
- **Timestamps:** `Created At` and `Updated At` on every table, stored in UTC and shown in the Jalali calendar.
- **Soft delete:** entities with history (User, Pet, Course, Course Run) use `Deleted At` instead of being removed.
- **Money:** stored as integers in **Rial**. No floating-point amounts. The UI shows toman (Rial ÷ 10), shortened as "هزار" or "میلیون".
- **Snapshots:** values that can change later (price, partner, refund policy) are copied at the moment they're used. The split of each sale is recorded by its purchase transaction.
- **Append-only money:** Payments, Transactions and Transaction Lines are never edited or deleted. Corrections are new transactions.

#### Relationship overview

```mermaid
erDiagram
  USER ||--o| TRAINER_PROFILE : has
  USER ||--o| PARTNER_PROFILE : has
  USER ||--o| WALLET : has
  USER ||--o{ PET : owns
  USER }o--o| USER : "referred by (partner)"
  USER ||--o{ COURSE : "creates / owns"
  REFUND_POLICY ||--o{ COURSE : "applies to"
  COURSE ||--o{ COURSE_PREREQUISITE : requires
  COURSE ||--o{ COURSE_RUN : "scheduled as"
  USER ||--o{ COURSE_RUN : teaches
  COURSE_RUN ||--o{ COURSE_SESSION : "split into"
  COURSE_RUN ||--o{ ENROLLMENT : has
  COURSE_RUN ||--o{ WAITLIST_ENTRY : has
  PET ||--o{ ENROLLMENT : "enrolled in"
  PET ||--o{ WAITLIST_ENTRY : waits
  ENROLLMENT ||--o| REVIEW : "reviewed by"
  COURSE ||--o{ COMMENT : has
  COMMENT ||--o{ COMMENT : "replied by"
  REVIEW ||--o| COMMENT : "written as"
  USER ||--o{ ORDER : places
  DISCOUNT_CODE ||--o{ ORDER : "applied to"
  ORDER ||--|{ ORDER_ITEM : contains
  ORDER_ITEM ||--|| ENROLLMENT : creates
  ORDER ||--o{ PAYMENT : "paid by"
  PAYMENT ||--o| TRANSACTION : "recorded as"
  ORDER_ITEM ||--o{ TRANSACTION : "purchase / refund"
  TRANSACTION ||--|{ TRANSACTION_LINE : "made of"
  WALLET ||--o{ TRANSACTION_LINE : "appears in"
  TRANSACTION |o--o{ TRANSACTION : "mirrored by"
  USER ||--o{ WITHDRAWAL_REQUEST : requests
  WITHDRAWAL_REQUEST ||--|{ TRANSACTION : "hold / payout / release"
  USER ||--o{ PARTNER_LEAD : "adds (partner)"
```

#### **1. User**

| Field                    | Notes                                          |
| ------------------------ | ---------------------------------------------- |
| Phone Number             | Unique, normalized.                            |
| Phone Verified At        | Set on first successful OTP.                   |
| First Name, Last Name    | Used in personal greetings.                    |
| Avatar                   | Optional image.                                |
| Role                     | `Admin`, `Trainer`, `Partner`, `Customer`.     |
| Status                   | `Active`, `Blocked`.                           |
| Referred By (Partner ID) | Customers only. Optional.                      |
| Referral Source          | `Link`, `QR Code`, `Pre-registration`, `None`. |
| Referred At              | When attribution happened.                     |
| Last Login At            |                                                |

- **Relations:** Customers, trainers and partners have one **Wallet**. Has one **Trainer Profile** or **Partner Profile** depending on role. A Customer has many **Pets** and **Orders**.

#### **2. Trainer Profile**

| Field                        | Notes                                        |
| ---------------------------- | -------------------------------------------- |
| User ID                      | One-to-one with a `Trainer` user.            |
| Bio                          | Shown on course and run pages.               |
| Specialties                  | e.g. obedience, behaviour, agility.          |
| Years of Experience          |                                              |
| Certificates                 | Uploaded files or titles.                    |
| City                         |                                              |
| Verified At                  | Set by an Admin. Shows the "تأییدشده" badge. |
| Rating Average, Rating Count | From reviews.                                |

#### **3. Partner Profile**

| Field         | Notes                                                    |
| ------------- | -------------------------------------------------------- |
| User ID       | One-to-one with a `Partner` user.                        |
| Business Name | e.g. the pet shop's name.                                |
| Business Type | `Pet Shop`, `Veterinary Clinic`, `Groomer`, `Other`.     |
| Referral Code | Unique, short, used in the referral link and QR code.    |
| City, Address |                                                          |
| Is Active     | Inactive partners' links stop attributing new customers. |

#### **4. Pet**

| Field               | Notes                                                       |
| ------------------- | ----------------------------------------------------------- |
| Owner (Customer ID) |                                                             |
| Name                |                                                             |
| Species             | `Dog`, `Cat`, `Bird`, `Other`.                              |
| Breed               | Free text or from a list.                                   |
| Sex                 | `Male`, `Female`.                                           |
| Birth Date          | Approximate is fine. Age is calculated from it, not stored. |
| Weight (kg)         |                                                             |
| Is Neutered         |                                                             |
| Photo               |                                                             |
| Microchip Number    | Optional.                                                   |
| Vaccination Status  | `Up to date`, `Partial`, `Unknown`.                         |
| Behaviour Notes     | Shown to the trainer (e.g. fear of other dogs).             |
| Medical Notes       | Shown to the trainer.                                       |

- **Relations:** Belongs to a **Customer**; Has many **Enrollments** and **Waitlist Entries**.

#### **5. Course (Curriculum)**

| Field                        | Notes                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------- |
| Title, Slug                  | Slug is unique and used in the URL.                                                               |
| Short Description            | Shown on course cards.                                                                            |
| Description                  | Full rich-text content.                                                                           |
| Cover Image                  |                                                                                                   |
| Category                     | e.g. `Obedience`, `Behaviour`, `Agility`, `Puppy`.                                                |
| Level                        | `Beginner`, `Intermediate`, `Advanced`.                                                           |
| Created By (User ID)         | Admin or Trainer.                                                                                 |
| Owner Trainer ID             | The trainer allowed to schedule runs. Empty for Admin-created courses. Changeable by Admin only.  |
| Target Species               | One or more species.                                                                              |
| Min / Max Pet Age (months)   | Optional eligibility range.                                                                       |
| Session Count                | e.g. 12. Part of the curriculum, the same for every run.                                          |
| Session Duration (minutes)   | e.g. 60.                                                                                          |
| Estimated Duration (weeks)   | Shown as "۶ هفته".                                                                                |
| Default Price                | Pre-filled into new runs. Each run sets its own price.                                            |
| Refund Policy ID             | Picked by the trainer, changeable by the Admin.                                                   |
| Trainer Share (%)            | Pre-filled from the platform default, changeable by the Admin.                                    |
| Ineligibility Message        | Custom text shown when a pet fails prerequisites or eligibility.                                  |
| Status                       | `Draft`, `Pending Approval`, `Awaiting Trainer Confirmation`, `Rejected`, `Approved`, `Archived`. |
| Rejection Reason             | Set when an Admin rejects it.                                                                     |
| Admin Changes                | List of fields the Admin changed during review, each with old and new value.                      |
| Admin Note                   | Shown to the trainer with the changes.                                                            |
| Approved By, Approved At     |                                                                                                   |
| Archived At                  |                                                                                                   |
| Rating Average, Rating Count | From reviews.                                                                                     |

- **Relations:** Has many **Prerequisites**, **Course Runs** and **Comments**; uses one **Refund Policy**.

#### **6. Course Prerequisite**

| Field              | Notes                                                         |
| ------------------ | ------------------------------------------------------------- |
| Course ID          | The course that has the requirement.                          |
| Required Course ID | The course the pet must have **Passed** (in any of its runs). |

- Unique on (Course ID, Required Course ID). A course can't require itself.

#### **7. Course Run (Cohort)**

| Field                             | Notes                                                                       |
| --------------------------------- | --------------------------------------------------------------------------- |
| Course ID                         | Must be an `Approved` course.                                               |
| Trainer ID                        | The trainer who teaches this run.                                           |
| Label                             | Optional, shown next to the course title (e.g. "پاییز ۱۴۰۵ · تهران").       |
| Format                            | `In Person`, `Online`, `Hybrid`.                                            |
| City, Location / Address          | For in-person runs.                                                         |
| Start Date                        |                                                                             |
| Estimated End Date                |                                                                             |
| Schedule Note                     | e.g. "شنبه و چهارشنبه، ساعت ۱۷".                                            |
| Enrollment Deadline               | Defaults to the start date.                                                 |
| Capacity                          | Max reservations.                                                           |
| Min Reservations to Start         | Must be ≤ Capacity.                                                         |
| Price                             | Rial.                                                                       |
| Status                            | `Draft`, `Published`, `Confirmed`, `In Progress`, `Completed`, `Cancelled`. |
| Published At                      |                                                                             |
| Confirmed At                      | When the minimum was reached.                                               |
| Cancelled At, Cancellation Reason |                                                                             |

**Calculated values** (from active enrollments, not entered by hand):

- **Reserved Count:** enrollments with status `Reserved`, `In Progress`, `Passed` or `Failed`, plus unexpired `Pending Payment` holds and unexpired waitlist offers.
- **Remaining to Start:** `max(0, Min Reservations to Start − Reserved Count)`.
- **Remaining Seats:** `Capacity − Reserved Count`.
- **Is Enrollment Open:** status is `Published` or `Confirmed`, the deadline hasn't passed, and seats remain.
- **Is Waitlist Open:** status is `Published` or `Confirmed`, the deadline hasn't passed, and no seats remain.

Reserved Count can be cached on the run row for fast listing, but it must be updated in the same transaction as the enrollment.

- **Relations:** Belongs to a **Course** and a **Trainer**; Has many **Course Sessions**, **Enrollments** and **Waitlist Entries**.

#### **8. Course Session**

| Field              | Notes                            |
| ------------------ | -------------------------------- |
| Course Run ID      |                                  |
| Order              | 1, 2, 3…                         |
| Title              | e.g. "آشنایی با فرمان‌های پایه". |
| Starts At          |                                  |
| Duration (minutes) | Defaults to the course's value.  |
| Location / Link    | Overrides the run's location.    |

- Optional in phase one. Without it, the run's Schedule Note is enough.

#### **9. Course Enrollment / Progress**

| Field                             | Notes                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| Course Run ID, Pet ID             |                                                                                            |
| Course ID                         | Copied from the run, so prerequisite checks don't need to go through runs.                 |
| Customer ID                       | Copied from the pet's owner for easier queries.                                            |
| Order Item ID                     |                                                                                            |
| Is Retake                         | The pet had already passed this course when it enrolled.                                   |
| Status                            | `Pending Payment`, `Reserved`, `Cancelled`, `Refunded`, `In Progress`, `Passed`, `Failed`. |
| Hold Expires At                   | For `Pending Payment`. The seat is released after this.                                    |
| Reserved At                       | When payment succeeded.                                                                    |
| Cancelled At, Cancellation Reason |                                                                                            |
| Attended Sessions                 | Count, updated by the trainer.                                                             |
| Completed Date                    | Set when the result is recorded.                                                           |
| Trainer Note                      | Feedback for the customer.                                                                 |

- Only one active (not `Cancelled`/`Refunded`) enrollment per (Course ID, Pet ID) among runs that haven't finished.
- _(Note: This tracks whether a specific pet meets the prerequisites for future courses. A prerequisite is met by any `Passed` enrollment with the required Course ID.)_

#### **10. Waitlist Entry**

| Field                 | Notes                                                             |
| --------------------- | ----------------------------------------------------------------- |
| Course Run ID, Pet ID | Unique together.                                                  |
| Customer ID           |                                                                   |
| Status                | `Waiting`, `Offered`, `Enrolled`, `Expired`, `Left`, `Closed`.    |
| Offered At            |                                                                   |
| Offer Expires At      | The held seat is released and offered to the next pet after this. |
| Enrollment ID         | Set when the customer pays for the offered seat.                  |

- Order in line is by `Created At`.

#### **11. Refund Policy**

| Field                    | Notes                                                    |
| ------------------------ | -------------------------------------------------------- |
| Name                     | e.g. "منعطف".                                            |
| Customer Description     | Plain explanation shown on the run page and at checkout. |
| Full Refund Until (days) | Days before start until which the refund is 100%.        |
| Partial Refund (%)       | From then until the start date.                          |
| After Start Refund (%)   | Usually 0.                                               |
| Is Active                | Inactive presets can't be picked for new courses.        |

- Managed by the Admin only.

#### **12. Discount Code**

| Field               | Notes                                                |
| ------------------- | ---------------------------------------------------- |
| Code                | Unique, case-insensitive (e.g. `NOROOZ1405`).        |
| Description         | Internal note for the Admin.                         |
| Type                | `Percentage`, `Fixed Amount`.                        |
| Value               | Percentage, or amount in Rial.                       |
| Max Discount Amount | Optional cap for percentage codes.                   |
| Min Order Amount    | Optional.                                            |
| Starts At, Ends At  |                                                      |
| Total Usage Limit   | Optional.                                            |
| Per Customer Limit  | Optional.                                            |
| First Order Only    |                                                      |
| Scope               | `All Courses`, `Selected Courses`.                   |
| Course IDs          | When the scope is `Selected Courses`.                |
| Used Count          | Paid orders that used it, minus fully refunded ones. |
| Is Active           | The Admin can turn a code off at any time.           |

#### **13. Order**

| Field               | Notes                                                                       |
| ------------------- | --------------------------------------------------------------------------- |
| Order Number        | Human-readable, unique (e.g. `ZR-140507-0042`).                             |
| Customer ID         |                                                                             |
| Partner ID          | Snapshot of the customer's partner at purchase time. Optional.              |
| Discount Code ID    | Optional.                                                                   |
| Subtotal            |                                                                             |
| Discount Amount     |                                                                             |
| Total Amount        |                                                                             |
| Paid From Wallet    | Part of the total paid from the wallet.                                     |
| Paid via Gateway    | Part of the total paid online.                                              |
| Refunded Amount     |                                                                             |
| Payment Status      | `Pending`, `Paid`, `Failed`, `Cancelled`, `Refunded`, `Partially Refunded`. |
| Order Date, Paid At |                                                                             |

- _(Note: Used to calculate partner revenue: `Total Amount − Refunded Amount` of paid orders.)_

#### **14. Order Item**

| Field                  | Notes                                                    |
| ---------------------- | -------------------------------------------------------- |
| Order ID               |                                                          |
| Course Run ID          |                                                          |
| Pet ID                 |                                                          |
| Unit Price             | Snapshot of the run's price.                             |
| Discount Amount        | This item's part of the order discount.                  |
| Paid Amount            | Unit Price − Discount Amount. Refunds are based on this. |
| Refund Policy Snapshot | The policy's day and percentage values at purchase time. |
| Refunded Amount        |                                                          |

- One item per pet per run. An order can reserve several pets or several runs at once.
- Each paid item has one `Purchase` transaction holding its split (see 3.8).

#### **15. Payment (Gateway)**

The log of money actually received through the payment gateway. It is kept separate from wallets and is **immutable**.

| Field                | Notes                                      |
| -------------------- | ------------------------------------------ |
| User ID              |                                            |
| Order ID             |                                            |
| Amount               |                                            |
| Gateway              | Name of the payment gateway.               |
| Gateway Authority    | The token used to start the payment.       |
| Reference ID         | The gateway's tracking code after success. |
| Card Number (masked) | e.g. `6037-99**-****-1234`.                |
| Status               | `Pending`, `Succeeded`, `Failed`.          |
| Failure Reason       |                                            |
| Paid At              |                                            |

- A row is created as `Pending` and moves to `Succeeded` or `Failed` exactly once, from the verified gateway callback. After that it is never edited or deleted, by anyone. The admin panel has no edit or delete action for it.
- A successful payment creates its `Gateway Payment` transaction (see 3.9).
- An order can have several payment attempts. Only one can succeed.
- Gateway callbacks must be verified server-side and handled idempotently (a repeated callback must not reserve or create transactions twice).

#### **16. Wallet**

| Field         | Notes                                                                           |
| ------------- | ------------------------------------------------------------------------------- |
| Owner User ID | For user wallets. One-to-one, created with the account.                         |
| System Kind   | For system wallets: `Admin`, `Gateway`, `Bank`, `Withdrawal Hold`. One of each. |
| Balance       | Rial. Cached sum of the wallet's transaction lines. Can be negative.            |

- Exactly one of Owner User ID and System Kind is set.
- Balance is updated in the same database transaction as the lines that change it.

#### **17. Transaction**

| Field                 | Notes                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Number                | Human-readable, unique (e.g. `TX-140507-0042`).                                                                  |
| Type                  | `Gateway Payment`, `Purchase`, `Refund`, `Withdrawal Hold`, `Withdrawal Payout`, `Withdrawal Release`, `Manual`. |
| Sum                   | Total of the positive lines. Cached for listing.                                                                 |
| Description           | Shown to every user who has a line in it (e.g. "خرید دوره اطاعت‌پذیری مقدماتی برای لئو").                        |
| Created By            | Empty for system transactions. The Admin, for `Manual` ones.                                                     |
| Mirror Of             | Optional. The transaction this one mirrors.                                                                      |
| Order Item ID         | For `Purchase` and `Refund`.                                                                                     |
| Payment ID            | For `Gateway Payment`.                                                                                           |
| Withdrawal Request ID | For the three withdrawal types.                                                                                  |

- Never edited or deleted, including its lines.
- At most one `Purchase` per order item.
- `Refund` and `Withdrawal Release` are always mirrors. A `Manual` transaction can be one too.

#### **18. Transaction Line**

| Field          | Notes                                                    |
| -------------- | -------------------------------------------------------- |
| Transaction ID |                                                          |
| Wallet ID      |                                                          |
| Amount         | Signed, never 0. Negative = sender, positive = receiver. |

- A transaction has at least two lines, and its lines add up to 0.
- Unique on (Transaction ID, Wallet ID).
- A user's wallet history is their own lines, joined with each transaction's number, type, description and date.

#### **19. Withdrawal Request**

| Field                    | Notes                                                     |
| ------------------------ | --------------------------------------------------------- |
| User ID                  |                                                           |
| Amount                   | Up to the user's balance at the time of the request.      |
| Sheba Number             | `IR` + 24 digits.                                         |
| Account Holder Name      |                                                           |
| Status                   | `Pending`, `Paid`, `Declined`, `Cancelled` (by the user). |
| Admin Note               | Shown to the user (e.g. why it was declined).             |
| Bank Tracking Code       | Entered by the Admin when approving.                      |
| Reviewed By, Reviewed At |                                                           |

- At most one `Pending` request per user.
- Creating it creates the `Withdrawal Hold` transaction. Approving creates the `Withdrawal Payout`. Declining or cancelling creates the `Withdrawal Release` (the mirror of the hold).

#### **20. Partner Lead (Pre-registration)**

| Field                 | Notes                                                                 |
| --------------------- | --------------------------------------------------------------------- |
| Partner ID            |                                                                       |
| Customer Phone Number | Normalized.                                                           |
| Customer Name         | Optional, to help the partner recognize the lead.                     |
| Note                  | Optional.                                                             |
| Status                | `Pending`, `Claimed`, `Lost` (registered via another partner's link). |
| Claimed By (User ID)  | The customer who registered.                                          |
| Claimed Date          |                                                                       |

- _(Note: Used to match a new customer's phone number upon registration if they didn't use a referral link.)_

#### **21. Review**

| Field                    | Notes                              |
| ------------------------ | ---------------------------------- |
| Enrollment ID            | Unique. One review per enrollment. |
| Customer ID, Pet ID      |                                    |
| Course ID, Course Run ID |                                    |
| Trainer ID               |                                    |
| Course Rating            | 1–5.                               |
| Trainer Rating           | 1–5.                               |
| Comment ID               | Optional. The review's comment.    |

#### **22. Comment**

| Field                      | Notes                                                                     |
| -------------------------- | ------------------------------------------------------------------------- |
| Course ID                  |                                                                           |
| Author (User ID)           | Customer, Trainer or Admin.                                               |
| Pet ID                     | Optional, shown next to the customer's name.                              |
| Parent Comment ID          | Set for replies. Replies can't have replies.                              |
| Body                       |                                                                           |
| Status                     | `Pending`, `Approved`, `Rejected`, `Hidden`. Replies start as `Approved`. |
| Rejection / Hide Reason    |                                                                           |
| Moderated By, Moderated At |                                                                           |

- A hidden comment hides all its replies, without changing the replies' own status, so restoring the comment brings them back.

#### **23. OTP Code**

| Field        | Notes                                   |
| ------------ | --------------------------------------- |
| Phone Number |                                         |
| Code Hash    | The code is never stored in plain text. |
| Expires At   |                                         |
| Attempts     |                                         |
| Consumed At  | A code can be used only once.           |
| IP Address   | For rate limiting.                      |

#### **24. Platform Setting**

Global values the Admin can change without a code release. Defaults:

| Setting                    | Default               |
| -------------------------- | --------------------- |
| Default trainer share      | To be decided (see 5) |
| Seat hold during payment   | 15 minutes            |
| Waitlist offer duration    | 12 hours              |
| OTP validity / resend wait | 2 min / 60 sec        |
| OTP max attempts           | 5                     |
| Minimum withdrawal amount  | To be decided         |
| Withdrawal response time   | 72 hours              |

---

### 5. Open Business Logic

The money **system** above (wallets, transactions, mirrors, withdrawals) is settled. These **business rules** decide the numbers that go into it, and are still open:

1. **Who pays the partner?** In the example in 3.8, the Admin keeps a fixed 20% and the partner's 10 comes out of the trainer's part. Is the trainer always the remainder (e.g. 80 when the customer has no partner)?
2. **Where is the split configured?** Is the Admin's (or trainer's) percentage set per course, as the current Trainer Share field is, or globally?
3. **How is partner commission calculated?** A fixed amount or a percentage per sale? On every purchase of a referred customer, or only the first? Is there an attribution window? The earlier design with monthly tiers and monthly statements (commit `1f62a76`) doesn't fit a per-sale split, so its Commission Plan, Commission Tier and Commission Statement entities were removed until this is decided.
4. **Who absorbs discounts?** If a 100 course is sold for 80, which shares shrink? Can the Admin's line be negative on a heavily discounted sale?
5. **How are partial refunds split?** When the refund policy gives back e.g. 50%, is the refund a proportional mirror (every line × 50%)?
