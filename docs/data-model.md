# Data model

MongoDB via Mongoose. Two collections, no relations between them.

## `users`

[src/models/User.js](../src/models/User.js)

| Field | Type | Notes |
| --- | --- | --- |
| `slackUserId` | String | Unique, sparse, optional. `U…`. Absent for rows imported before linking |
| `name` | String | **Required.** Display name, used as the fallback when there is no `slackUserId` |
| `birthday` | Date | Optional. Stored at **UTC midnight**; the year is ignored when matching |
| `anniversary` | Date | Optional. Stored at **UTC midnight**; the year drives the "N year" count |
| `email` | String | Optional. Used by `/link-users` to match Slack accounts |
| `isActive` | Boolean | Default `true`. `/remove-user` sets it false — a soft delete |
| `isAdmin` | Boolean | Default `false`. Gates every slash command |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

Indexes: unique sparse on `slackUserId`, plus `birthday` and `anniversary`.

> The `birthday` and `anniversary` indexes do not currently serve any query — the
> daily job loads all active users and filters in memory, because "same month and
> day, any year" is not expressible against a stored `Date`. They are harmless at
> this scale. Removing them, or replacing them with stored `MM-DD` strings, only
> pays off in the thousands of rows.

### The sparse unique index

`slackUserId` is unique *and* sparse, so many rows may omit it but no two rows may
share one. Two consequences worth knowing:

- `/remove-user` deactivates rather than deleting, so the Slack ID stays claimed.
  `/add-user` therefore looks for an existing row and reactivates it instead of
  inserting a duplicate.
- The CSV importer never invents a placeholder ID. A fabricated value would satisfy
  the index but render in Slack as a broken `<@TEMP_JOHN_DOE>` mention and hide the
  row from `/unlinked-users`.

### Why UTC midnight

`new Date("1990-05-15")` is parsed by JavaScript as `1990-05-15T00:00:00Z`. Read it
back with `getDate()` and any server west of UTC reports the **14th**. Every read
goes through [src/utils/dates.js](../src/utils/dates.js), which uses UTC getters.
Every write goes through `parseDateOnly`, which builds the value with `Date.UTC`.
See [scheduling.md](scheduling.md#the-timezone-rule).

## `questions`

[src/models/Question.js](../src/models/Question.js)

| Field | Type | Notes |
| --- | --- | --- |
| `text` | String | **Required, unique.** The question as posted |
| `isUsed` | Boolean | Default `false`. Set true once a post succeeds |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

Indexed on `isUsed`.

The Thursday job samples one unused question. When none are left it flips every
question back to unused and samples again, so the rotation loops instead of going
quiet. `isUsed` is only set **after** Slack confirms the post, so a failed send
retries the same question next week rather than burning it.

There is no seeder — see [operations.md](operations.md#loading-watercooler-questions).
