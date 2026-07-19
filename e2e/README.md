# End-to-end tests

Playwright, driving `frontend` and `admin-frontend` against a production-like build.

The suite that matters most lands in Phase 2: **publish a blog via the admin API, poll
the public page, assert the new content appears within 2 seconds.** That test is the exit
criterion for on-demand revalidation — it is the thing that proves the current
ten-minute content delay is actually gone, and it runs both in CI and as a post-deploy
smoke check.

Phase 9 adds the remaining core flows: contact submit → inquiry row, work detail,
admin login → lead status change, admin blog → public blog, and the chat realtime pair.
