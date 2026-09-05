---
status: accepted
---

# Staff read German; code and documentation use English

The staff dashboard UI uses German (`A6`). Code identifiers, enum values, wire
formats, documents, specifications, comments, and tracker prose use English.
German UI strings belong in the dashboard's UI copy; documentation refers to
the English domain terms and does not reproduce German labels or translation
tables. This includes the glossary in [`CONTEXT.md`](../../CONTEXT.md).

This decision resolves issue #12 within the dashboard work in issue #10. It
supersedes the English-dashboard assumption and the requirement to record
dashboard translations in the glossary from
[ADR-0001](./0001-english-code-german-copy.md). Its English identifier and wire
format decision remains in force. The separate application and component
boundary established by
[ADR-0002](./0002-dashboard-as-separate-application.md) also remains in force.

An English dashboard would align the UI with the team's working language but
would make staff members work in a different language from their public
communication (`A6`). German identifiers and bilingual documentation would
reduce the translation step but couple the team's vocabulary to UI wording.
Keeping German in UI copy lets staff read their working language while the
team maintains one English vocabulary, independent of label changes.
