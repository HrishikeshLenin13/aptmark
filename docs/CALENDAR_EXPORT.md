# Study-plan calendar export

The planner exports the signed-in workspace’s next scheduled study days as a portable `.ics` file. The server derives the plan from the session owner’s preferences and practice history; URL parameters do not select another account. The response is private and non-cacheable.

Events are **all-day, transparent reminders**, not reserved appointment slots. They include the suggested study duration, skill and question count. There is no calendar-provider connection, automatic update, subscription or notification service. Re-export after changing a plan; the importing calendar decides how repeated imports are handled.

The implementation follows [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545.html): CRLF content lines, escaped text values, UTF-8-safe 75-octet folding, date-only starts, exclusive next-day ends, and stable owner-scoped hashed event identifiers. No email address, raw account identifier or session token is included. Links in descriptions are relative workspace paths rather than a public hosting claim.

Unit checks cover date boundaries, Unicode folding, delimiters/property injection and identity stability. The isolated browser check downloads the file, compares it to the owner’s actual plan, verifies authentication and no-store behavior, and audits desktop/tablet/mobile planner views.
