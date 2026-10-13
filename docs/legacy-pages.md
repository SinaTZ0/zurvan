# Legacy Pages

Pages and shared components that are still in the **old look** (slate, gold leaf, Amiri) or built for the **old spec** (staff trainers, slots, tests, behavior requests, wallets). The home page is the only page built in the new look so far ([storefront-design.md](storefront-design.md)); every other page picks up the new colours and fonts through the tokens, but not the new layout, imagery or voice.

**Agents: read this before changing any file in a route or component listed here.** Find its row, follow its verdict below, and update this doc in the same commit when a row is done.

## Verdicts

| Verdict      | Meaning                                                                         | What to do when a task touches it                                                                                                                                                                                                                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Redesign** | The feature is still right in [app-spec.md](app-spec.md); only the look is old. | **Small change** (a bug fix, copy, one field, a validation rule): make it in the page's current look, no redesign. **Anything that changes the layout or adds a section:** redesign the whole page first, following [design-flow.md](design-flow.md) and [storefront-design.md](storefront-design.md) (brief, shown to the user before UI code), then make the change. |
| **Rebuild**  | app-spec changed how the feature works, so the page's flow is wrong.            | Don't patch the old page. Build the app-spec page fresh in the new look (brief first), point the links at it, then delete the old route slice and its row here.                                                                                                                                                                                                        |
| **Retire**   | The feature is dropped in app-spec.                                             | Don't change it or build on it. If a task seems to need it, tell the user the feature is dropped. Delete it when the code refactor removes its feature, along with its row here.                                                                                                                                                                                       |

When a page is redesigned or rebuilt, remove its row and add it to the "Built in the new look" list at the end.

## Public Pages

| URL                      | Route slice             | app-spec page                                            | Verdict      | Notes                                                                                                                                                                                                                                                                                                                         |
| ------------------------ | ----------------------- | -------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/courses/:slug`         | `course_detail`         | Course Detail (F8, F4, F5)                               | **Rebuild**  | Mockup: `image-reference/photo_5940492838061674607_y-444.png`. Gains: which of the customer's dogs qualify, and «افزودن به سبد». Loses: tests, reviews and questions (`CourseDiscussion`, `discussion.ts`, `Stars`), the refund policy in the price sheet, booking a dog «با پرونده». Course photos are already the new ones. |
| `/assessment`            | `assessment`            | Evaluation Request (F3)                                  | **Rebuild**  | Becomes a signed-in customer page: dog, photos and videos, earliest date, when they're free. No slots. Every «ارزیابی رایگان» button on the home page links here until then.                                                                                                                                                  |
| `/behavior-modification` | `behavior_modification` | —                                                        | **Retire**   | Behavior requests are dropped. Its video upload (`api_behavior_videos`, `use-video-upload.ts`) is reused for evaluation photos and videos ([media.md](media.md)).                                                                                                                                                             |
| `/auth`                  | `auth`                  | Login / Register (F1)                                    | **Redesign** | The flow is unchanged.                                                                                                                                                                                                                                                                                                        |
| header, footer           | `layout_public`         | (every public page)                                      | **Redesign** | Only the nav links and footer links were updated. The references have a gold «ارزیابی رایگان» pill in the header.                                                                                                                                                                                                             |
| not built                | —                       | Course Catalogue, Help and FAQ, Privacy, Partner Enquiry | —            | Build new, in the new look. `/courses` is linked from the header search; the home page's course grid uses `/#courses` until then.                                                                                                                                                                                             |

## Customer Pages (`/account`)

| URL                                 | Route slice                 | app-spec page                                            | Verdict      | Notes                                                                                          |
| ----------------------------------- | --------------------------- | -------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------- |
| shell                               | `layout_account`            | (every customer and partner page)                        | **Redesign** | Tabs follow the new pages: Dashboard, Cart, Purchases.                                         |
| `/account`                          | `account_home`              | Dashboard (F2, F3, F6)                                   | **Rebuild**  | My dogs, open evaluation requests, my enrollments.                                             |
| `/account/dogs`                     | `account_dogs`              | Dashboard                                                | **Rebuild**  | The dogs list folds into the Dashboard.                                                        |
| `/account/dogs/:dogId`              | `account_dog_detail`        | Dog Detail (F2, F3, F6)                                  | **Rebuild**  | Evaluated or not, passed courses, evaluations, enrollments. No sessions, tests or assessments. |
| `/account/dogs/new`, `…/edit`       | `account_dog_form`          | Dog Form (F2)                                            | **Redesign** | Fields are unchanged. Add: birth date and breed locked once the dog is evaluated.              |
| `/account/assessments`              | `account_assessments`       | —                                                        | **Retire**   | Evaluations show on the Dashboard and Dog Detail.                                              |
| `/account/book/:courseSlug`         | `account_book`              | —                                                        | **Retire**   | Replaced by «افزودن به سبد» on Course Detail (F5).                                             |
| `/account/checkout/:orderId`        | `account_checkout`          | Cart (F5)                                                | **Rebuild**  | The cart lives in the browser; checkout pays every eligible item at once.                      |
| `/account/checkout/:orderId/result` | `account_payment_result`    | —                                                        | **Retire**   | The result is a banner on the Cart.                                                            |
| `/account/training`                 | `account_training`          | Purchases (F5)                                           | **Rebuild**  | Past payments and the enrollments each bought. No sessions.                                    |
| `/account/training/:enrollmentId`   | `account_enrollment_detail` | —                                                        | **Retire**   | No customer Enrollment Detail; Dog Detail lists enrollments.                                   |
| `/account/behavior-requests`        | `account_behavior_requests` | —                                                        | **Retire**   | Behavior requests are dropped.                                                                 |
| not built                           | —                           | Profile Settings, Partner Dashboard, Leads and Customers | —            | Build new, in the new look.                                                                    |

## Trainer Pages (`/trainer`)

There are no trainer accounts any more (the other trainers are only shown on the home page), and the Admin's area is new (app-spec, Pages: Admin). **Retire all of these.** Build the Admin pages new, in the new look; the old trainer pages can be read for ideas, not patched.

| URL                                     | Route slice                       |
| --------------------------------------- | --------------------------------- |
| shell                                   | `layout_trainer`                  |
| `/trainer`                              | `trainer_schedule`                |
| `/trainer/assessments/:assessmentId`    | `trainer_assessment_detail`       |
| `/trainer/enrollments`                  | `trainer_enrollments`             |
| `/trainer/enrollments/:enrollmentId`    | `trainer_enrollment_detail`       |
| `/trainer/behavior-requests`            | `trainer_behavior_requests`       |
| `/trainer/behavior-requests/:requestId` | `trainer_behavior_request_detail` |

## Shared Components in the Old Look

In `app/components/`. A component follows the verdicts of the pages that use it: when its last legacy user is gone, retire it or bring it into the new look with the first new page that needs it.

| Component                                            | Used by                                                               | Verdict      | Notes                                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------- |
| `dog-tag`                                            | most account and trainer pages, `assessment`, `behavior_modification` | **Redesign** | The account area's "punched metal tag". Decide its new look with the Dashboard rebuild.  |
| `dog-portrait`, `dog-profile`                        | dog pages, trainer details                                            | **Redesign** | Still needed for Dog Detail.                                                             |
| `enrollment-status-badge`                            | enrollment and dog pages                                              | **Rebuild**  | Statuses are now `active`, `completed`, `cancelled` (F6).                                |
| `assessment-status-badge`                            | assessments, trainer schedule                                         | **Rebuild**  | Becomes the evaluation status: `requested`, `evaluated`, `rejected`, `withdrawn` (F3).   |
| `receipt`                                            | `account_book`, `account_checkout`, `account_payment_result`          | **Redesign** | Could carry the Cart and Purchases; decide with the Cart rebuild.                        |
| `fact`, `section-heading`, `segmented-choice`        | course detail, forms                                                  | **Redesign** | Generic; restyle when their page is rebuilt.                                             |
| `doodles` (the walking figures)                      | account empty states, `course_detail`                                 | **Redesign** | The new look uses the chalk doodles (`routes/home/components/chalk-doodle.tsx`) instead. |
| `stamp`                                              | assessments, behavior requests, payment result                        | **Retire**   | All its users are retired.                                                               |
| `session-card`                                       | training and enrollment pages                                         | **Retire**   | Lessons aren't tracked.                                                                  |
| `plan-slip`, `behavior-status-badge`, `video-player` | behavior requests                                                     | **Retire**   | `video-player` may come back for evaluation videos; read it before writing a new one.    |
| `stars`                                              | `course_detail`                                                       | **Retire**   | Reviews are dropped.                                                                     |

## Built in the New Look

- Home (`/`): `app/routes/home/`, documented in [storefront-design.md](storefront-design.md).
