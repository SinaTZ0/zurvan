# Legacy Pages

Pages and shared components that are still in the **old look** (slate, gold leaf, Amiri) or built for the **old spec**. The pages listed under "Built in the New Look" at the end are in the new look ([storefront-design.md](storefront-design.md)); every other page picks up the new colours and fonts through the tokens, but not the new layout, imagery or voice.

**Agents: read this before changing any file in a route or component listed here.** Find its row, follow its verdict below, and update this doc in the same commit when a row is done.

## Verdicts

| Verdict      | Meaning                                                                         | What to do when a task touches it                                                                                                                                                                                                                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Redesign** | The feature is still right in [app-spec.md](app-spec.md); only the look is old. | **Small change** (a bug fix, copy, one field, a validation rule): make it in the page's current look, no redesign. **Anything that changes the layout or adds a section:** redesign the whole page first, following [design-flow.md](design-flow.md) and [storefront-design.md](storefront-design.md) (brief, shown to the user before UI code), then make the change. |
| **Rebuild**  | app-spec changed how the feature works, so the page's flow is wrong.            | Don't patch the old page. Build the app-spec page fresh in the new look (brief first), point the links at it, then delete the old route slice and its row here.                                                                                                                                                                                                        |
| **Retire**   | The feature is dropped in app-spec.                                             | Don't change it or build on it. If a task seems to need it, tell the user the feature is dropped. Delete it when the code refactor removes its feature, along with its row here.                                                                                                                                                                                       |

When a page is redesigned or rebuilt, remove its row and add it to the "Built in the new look" list at the end.

## Public Pages

| URL            | Route slice     | app-spec page                                            | Verdict      | Notes                                                                                                                             |
| -------------- | --------------- | -------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `/auth`        | `auth`          | Login / Register (F1)                                    | **Redesign** | The flow is unchanged.                                                                                                            |
| header, footer | `layout_public` | (every public page)                                      | **Redesign** | Only the nav links and footer links were updated. The references have a gold «ارزیابی رایگان» pill in the header.                 |
| not built      | —               | Course Catalogue, Help and FAQ, Privacy, Partner Enquiry | —            | Build new, in the new look. `/courses` is linked from the header search; the home page's course grid uses `/#courses` until then. |

## Customer Pages (`/account`)

| URL                           | Route slice        | app-spec page                                            | Verdict      | Notes                                                                                                                                                                                                                               |
| ----------------------------- | ------------------ | -------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| shell                         | `layout_account`   | (every customer and partner page)                        | **Redesign** | Tabs follow the new pages: Dashboard, Cart, Purchases (only «سگ‌های من» is listed until they exist).                                                                                                                                |
| `/account/dogs/new`, `…/edit` | `account_dog_form` | Dog Form (F2)                                            | **Redesign** | Fields are unchanged. The delete button is gone (dogs are never deleted). Birth date and breed are locked once the dog is evaluated (shown read-only, the stored values submitted unchanged), which is done. Only the look is left. |
| `/account/checkout/:orderId`  | `account_checkout` | Cart (F5)                                                | **Rebuild**  | The cart lives in the browser; checkout pays every eligible item at once (`checkout.review`, `checkout.pay`). The slice is deleted; the gateway callback lands on `/account?payment=…` until the Cart exists.                       |
| `/account/training`           | `account_training` | Purchases (F5)                                           | **Rebuild**  | Past payments and the enrollments each bought (`checkout.payments`). The slice is deleted.                                                                                                                                          |
| not built                     | —                  | Profile Settings, Partner Dashboard, Leads and Customers | —            | Build new, in the new look.                                                                                                                                                                                                         |

## Shared Components in the Old Look

In `app/components/`. A component follows the verdicts of the pages that use it: when its last legacy user is gone, retire it or bring it into the new look with the first new page that needs it.

| Component          | Used by            | Verdict      | Notes                                                             |
| ------------------ | ------------------ | ------------ | ----------------------------------------------------------------- |
| `segmented-choice` | `account_dog_form` | **Redesign** | Generic; restyle when their page is rebuilt.                      |
| `receipt`          | (no page yet)      | **Redesign** | Could carry the Cart and Purchases; decide with the Cart rebuild. |

## Built in the New Look

- Home (`/`): `app/routes/home/`, documented in [storefront-design.md](storefront-design.md).
- Evaluation Request (`/assessment`): `app/routes/assessment/`. A signed-in customer page: the dog's bubble guides the form, and the page turns into a receipt when it is sent.
- Dashboard (`/account`): `app/routes/account_home/`. A signed-in customer page: one card per dog, each with the dog's bubble saying its state and one main action, the dog's active enrollments and passed-course chips, and a link to Dog Detail.
- Dog Detail (`/account/dogs/:dogId`): `app/routes/account_dog_detail/`. A signed-in customer page: a header band where the photo fades into black and the dog's bubble draws itself in, with passed courses as medals, then enrollments, evaluation requests and a sticky profile column on desktop.
- Shared pieces for those two pages: `DogPhoto` (`app/components/dog-photo.tsx`), `WithdrawEvaluationButton` (`app/components/withdraw-evaluation-button.tsx`) and `getDogStatus` (`app/lib/dog-status.ts`).
- Course Detail (`/courses/:slug`): `app/routes/course_detail/`. A public page: the course's facts and a buy card in the hero where the customer's dogs are a radio list and the picked dog answers in a chalk bubble (it can take the course, or why not, with a way out), «افزودن به سبد» into the browser cart (`app/atoms/cart.ts`), then what the course teaches, its lane and the free-evaluation ask.
