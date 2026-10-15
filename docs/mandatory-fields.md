# Marking mandatory and optional fields in the draft form

Status: decided 2026-09-29.

This document explains how the draft form (the step-by-step dialog a researcher
fills in before creating a request) shows which fields are mandatory, and why.

## The problem

Previous behaviour:

- Mandatory fields had a red `*`. Once the field was filled, the `*` changed to
  the label colour (blue).
- Optional fields had no marking.

Feedback:

- **Management:** users assume that every field must be filled. They only skip
  a field when they see the word "optional". The red `*` that turns blue is not
  clear. Red should only appear once the user has finished a step and moved on
  with a mandatory field left empty; then the step's title and description turn
  red.
- **Stakeholders:** the `*` is a well-known sign for "mandatory". Writing
  "optional" on every optional field adds too many labels.
- Both groups needed an explanation of the red-to-blue `*` before they
  understood it. That alone shows the signal is not clear enough.

## The form in numbers

These are the fields a researcher sees in the DKTK configuration (counted on a
draft with all resource types selected, 2026-09-29):

| Step                    | Mandatory | Optional |
|-------------------------|----------:|---------:|
| Your selected cohort    |         3 |        1 |
| Your Project            |        11 |        6 |
| Biosample Request       |         9 |        6 |
| Molecular Data Request  |         0 |        7 |
| Ethics and Compliance   |         4 |        0 |
| Conflicts of Interest   |         0 |        1 |
| **Total**               |   **~27** |  **~21** |

The usual guidance is to mark whichever group is smaller. Here neither is
clearly smaller, so marking every optional field would mean about 20 "optional"
labels, and marking only mandatory fields leaves the other half unexplained.
Some steps are, however, entirely optional or entirely mandatory.

## Decision

1. **Mandatory fields keep the `*`, and it never changes colour.** The `*` has
   the label's colour whether the field is filled or not.
2. **Red means an error, and only appears after the user has left the step.**
   When a step is left with a mandatory field empty, the stepper shows the step
   in red with a `!`. When the user comes back to that step, the empty
   mandatory fields are shown in red. On the first visit of a step nothing is
   red.
3. **Every step starts with one line explaining the marking:**
   - "Fields marked with * are required." if the step has mandatory fields;
   - "All fields in this step are optional." if it has none;
   - "Select at least one option." on the step where the requested resources
     are chosen: a request cannot be created without them, but that choice is
     a set of option cards without a field title that could carry a `*`.
4. **"optional" is written only where a whole block can be left out**, next to
   the block title, e.g. "Collaborator (optional)". A block counts as optional
   when no entry of it is required, or when none of its fields is mandatory. Its
   mandatory fields apply only to an entry once the user adds one.
5. **Mandatory inputs carry `aria-required="true"`**, so screen readers announce
   them. The `*` itself is hidden from screen readers, as the line at the top of
   the step explains it.

## Why

- **A colour that changes is not a standard signal.** Common guidance for forms
  uses a fixed marker for mandatory fields. Showing a state only by colour
  (red → blue) also goes against WCAG 2.1 success criterion 1.4.1 ("Use of
  Color"), and people with colour-vision deficiencies cannot see it.
- **Error colour should come after the user has had a chance.** Showing errors
  before a field has been attempted is widely discouraged (for example by the
  GOV.UK Design System, which validates when the user submits). A step is our
  unit of submission, so "after leaving the step" is the right moment.
- **The `*` needs an explanation.** WCAG 2.1 success criterion 3.3.2 ("Labels or
  Instructions") asks for instructions when input is required. NN/g recommends
  explaining the `*` at the top of the form. One line per step does this and
  addresses the concern that users do not know which fields they may skip.
- **Marking the exceptions keeps the labels few.** "optional" appears only on
  entirely optional steps and blocks. Those are the places where users waste the
  most effort today, and marking them costs only a handful of labels. It also
  avoids layout problems, as the note sits in the step or block header rather
  than next to each field in multi-field rows.
- **The costly mistake is already caught.** A user who treats an optional field
  as mandatory spends some extra effort but makes no mistake. A user who skips a
  mandatory field is caught by the red step in the stepper and by the check
  before the request can be created. The marking only has to be clear and
  consistent; it does not need to label every field.

## Where it is implemented

- `src/components/MandatoryFieldMarker.vue`: the `*` (label colour,
  `aria-hidden`).
- `src/components/ProjectFieldRow.vue`: `highlightMissing` prop (red title of an
  empty mandatory field) and `aria-required` on the inputs.
- `src/components/ProjectView.vue`:
  - `highlightMissingFields`: whether the current step was already left once
    (visited earlier in this session, or a later step holds saved data);
  - `mandatoryLegend()`, `currentStepHasMandatoryFields()`: the line at the
    top of the step;
  - `isOptionalBlock()`: the "(optional)" note on block titles;
  - `draftStepState()`, `fetchMissingFixedFieldSteps()`: the stepper's ✓ / `!`.

## When to revisit

- If the balance of the form changes a lot (for example, almost all fields
  become mandatory), marking only the optional fields may become the simpler
  rule.
- If users still fill in optional fields that are not marked as such, the next
  step would be to mark every optional field with "(optional)".

## References

- W3C, WCAG 2.1: success criteria 1.4.1 (Use of Color), 3.3.1 (Error
  Identification) and 3.3.2 (Labels or Instructions).
- W3C WAI, Forms Tutorial: "Labeling Controls" (marking required fields).
- Nielsen Norman Group: "Marking Required Fields in Forms".
- GOV.UK Design System: guidance on optional questions and on error messages.
