# ichbinhier — Form Design Specification

> Design specification for the new volunteer application form for **ichbinhier e.V.**
>
> Use this document together with `token.json` and `theme.css` for Figma, Stitch, frontend implementation, and design review.

---

## 1. Goal

The form must feel like a native part of **ichbinhier.eu**, not like an embedded SaaS form.

Core UX principle:

> **Every additional field costs submissions.**

The form should be completable on a phone in approximately **two minutes**. Anything that can be asked later — during an Info-Runde, a conversation, or the first task — must be asked later.

The experience should communicate:

- low effort;
- clarity;
- confidence;
- immediate next steps;
- no unnecessary bureaucracy;
- no vague “wir melden uns”.

---

## 2. Design Source

Primary visual reference:

`https://www.ichbinhier.eu/`

Use the existing site's visual language:

- red editorial headings;
- purple/lila halftone graphics;
- creme page background;
- Akhand Soft typography;
- strong whitespace and vertical rhythm;
- compact, direct navigation;
- simple CTA buttons;
- expressive but restrained civic/nonprofit tone.

Do **not** redesign the brand.

The target is a new form that looks as though it has always belonged to the existing site.

---

## 3. Brand Character

The interface should feel:

- civic;
- editorial;
- direct;
- approachable;
- active;
- optimistic;
- human;
- slightly playful.

It should **not** feel:

- corporate;
- governmental;
- enterprise/SaaS;
- dashboard-like;
- overly glossy;
- over-designed.

Avoid:

- glassmorphism;
- unrelated gradients;
- blue enterprise UI as a primary palette;
- large 24–32px rounded cards;
- floating labels;
- icon-heavy inputs;
- unnecessary progress steps;
- wizard patterns.

---

## 4. Confirmed Brand Colors

These values are source-of-truth values extracted from the website CSS.

| Token         | Value     | Role                         |
| ------------- | --------- | ---------------------------- |
| `fuut-purple` | `#8437b6` | secondary brand, hero, focus |
| `fuut-lila`   | `#dcbae6` | halftone, subtle accents     |
| `fuut-red`    | `#e31119` | primary brand, headings, CTA |
| `fuut-gray`   | `#4f4f4f` | main text                    |
| `fuut-creme`  | `#f6f5f1` | page background              |

### Semantic mapping

```text
Page background       #f6f5f1
Surface               #ffffff
Primary text          #4f4f4f
Primary action        #e31119
Secondary action      #8437b6
Focus                 #8437b6
Decorative lila       #dcbae6
Error                 #e31119
```

Do not replace the red or purple with approximate colors.

---

## 5. Typography

### Primary font

The site uses **Akhand Soft Regular**.

```css
@font-face {
  font-family: 'Akhand Soft';
  src: url('//www.ichbinhier.eu/wp-content/uploads/font-organizer/Indian-Type-Foundry-AkhandSoft-Regular.ttf')
    format('truetype');
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}
```

Fallback:

```text
"Akhand Soft", "Nunito", Arial, sans-serif
```

**Nunito** is self-hosted as a substitute for environments where the brand face is unavailable: the closest free face to Akhand Soft (geometric sans, rounded terminals, tall x-height), licensed under SIL OFL.

Nunito is a technical fallback, not part of the brand. Do not use it in Figma, and do not design against its metrics.

Only the Regular file is currently confirmed. Do not assume true Medium/Bold files exist.

Create hierarchy mainly through:

- size;
- color;
- spacing;
- scale;
- composition.

---

## 6. Confirmed Font Scale

The site exposes these WordPress presets:

| Token   |   Size |
| ------- | -----: |
| Small   | `13px` |
| Medium  | `20px` |
| Large   | `36px` |
| X-Large | `42px` |

Recommended usage:

### Page title

```text
Desktop   42px
Mobile    36px
Line-height ~1.05
Color     #e31119
```

### Section / panel title

```text
36px
Line-height ~1.08
```

### Body / label / input

```text
20px
Line-height ~1.4
```

### Hint / validation / privacy

```text
13px
Line-height ~1.35–1.4
```

Avoid introducing many additional sizes.

---

## 7. Confirmed Spacing Scale

The site exposes the following WordPress spacing presets.

| Token        |     Value | Approx. px at 16px root |
| ------------ | --------: | ----------------------: |
| `spacing-20` | `0.44rem` |                   `7px` |
| `spacing-30` | `0.67rem` |                  `11px` |
| `spacing-40` |    `1rem` |                  `16px` |
| `spacing-50` |  `1.5rem` |                  `24px` |
| `spacing-60` | `2.25rem` |                  `36px` |
| `spacing-70` | `3.38rem` |                  `54px` |
| `spacing-80` | `5.06rem` |                  `81px` |

### Semantic use

```text
Label → control             11px
Control → hint               7px
Field → field               24px
Title → subtitle            16px
Header block → form         36px
Form → submit               36px
Panel inner padding         36px
Desktop card padding        54px
Large section spacing       54–81px
```

Do not introduce a parallel spacing system unless necessary.

---

## 8. Confirmed Shadows

```css
--wp--preset--shadow--natural: 6px 6px 9px rgba(0, 0, 0, 0.2);

--wp--preset--shadow--deep: 12px 12px 50px rgba(0, 0, 0, 0.4);

--wp--preset--shadow--sharp: 6px 6px 0 rgba(0, 0, 0, 0.2);

--wp--preset--shadow--outlined:
  6px 6px 0 -3px rgb(255, 255, 255), 6px 6px rgb(0, 0, 0);

--wp--preset--shadow--crisp: 6px 6px 0 rgb(0, 0, 0);
```

Use shadows sparingly for this form.

Recommended form card:

```css
box-shadow: 0 8px 28px rgba(79, 79, 79, 0.1);
```

Avoid deep modal-like floating shadows.

---

## 9. Radius

The existing site is not driven by exaggerated rounded UI.

Recommended:

```text
Input         4px
Select        4px
Button        4px
Main card     8px
Info panel    8px
```

Avoid 20px+ radii.

---

## 10. Layout

### Desktop

```text
Max page container       1280px
Page gutter               48px
Form max width            960px
Form content width       ~760px
Card padding             ~54px
```

### Tablet

```text
Page gutter               32px
Card padding             ~36px
```

### Mobile

```text
Reference width          375px
Page gutter               20px
Card padding              24px
```

---

## 11. Page Structure

```text
┌──────────────────────────────────────────┐
│ Header / navigation                      │
├──────────────────────────────────────────┤
│ Purple + lila halftone brand strip       │
├──────────────────────────────────────────┤
│                                          │
│        Main form / content card          │
│                                          │
├──────────────────────────────────────────┤
│ Footer / existing site continuation      │
└──────────────────────────────────────────┘
```

The form card is page content, not a modal.

---

## 12. Header

Keep the existing site language.

Desktop navigation:

```text
ÜBER UNS
ENGAGEMENT
BILDUNG
NEUIGKEITEN
VERANSTALTUNGEN
SPENDE
```

Rules:

- logo on the left;
- red navigation labels;
- purple `SPENDE` CTA;
- search icon on the right;
- no new standalone form header.

Mobile:

- logo left;
- compact menu icon right;
- desktop navigation hidden.

---

## 13. Brand Strip / Halftone

Use:

```text
Purple background   #8437b6
Lila dots           #dcbae6
```

Recommended height:

```text
Desktop ~220px
Mobile  ~140px
```

The halftone motif may also appear subtly near content edges or in empty states.

Do not place dense dots behind body text.

---

## 14. Main Form Card

Recommended:

```text
Max width            960px
Content max width    760px
Background           #ffffff
Desktop padding      ~54px
Tablet padding       ~36px
Mobile padding        24px
Radius                 8px
```

Use generous whitespace without making the page feel empty.

---

# 15. Core Page Copy

## Heading

**ichbinhier lebt vom Mitmachen.**

## Subheading

**Sag uns in zwei Minuten, wie du dabei sein möchtest. Deine Bestätigung mit allen weiteren Infos kommt sofort per E-Mail — kein „wir melden uns“.**

The two-minute promise is part of the UX value proposition and must remain visually prominent.

The concrete next step — the date of the next Info-Runde, an individual appointment for Rechtliche Unterstützung, or an honest waitlist message — is carried by the confirmation email, not by the screen. The subheading therefore promises an email, and the screen must not promise anything it cannot show.

---

# 16. Form Model

There are exactly **six fields**.

| #   | Field                       | Type     | Required | Visible            |
| --- | --------------------------- | -------- | -------- | ------------------ |
| 1   | Wie möchtest du uns helfen? | select   | yes      | always             |
| 2   | Name                        | text     | yes      | Vereinsarbeit only |
| 3   | E-Mail                      | email    | yes      | Vereinsarbeit only |
| 4   | Zeit pro Woche              | select   | yes      | Vereinsarbeit only |
| 5   | Erzähl uns kurz von dir     | textarea | no       | Vereinsarbeit only |
| 6   | Einwilligung Datenschutz    | checkbox | yes      | Vereinsarbeit only |

No additional application fields should be introduced.

---

# 17. Field 1 — Route Selector

### Label

**Wie möchtest du uns helfen?**

### Placeholder

**Bitte wählen …**

### Hint

**Danach zeigen wir dir nur, was für deinen Weg wirklich nötig ist.**

### Options

Order is mandatory:

```text
1. Bei #ichbinhier mitmachen (Aktionsgruppe)
2. Social Media
3. Redaktion / Öffentlichkeitsarbeit
4. Rechtliche Unterstützung
5. Fördermitglied werden
6. Etwas anderes
```

This field is the central decision point of the experience.

Give it stronger visual prominence than a routine select.

---

# 18. Routing Logic

## Aktionsgruppe

Selection:

**Bei #ichbinhier mitmachen (Aktionsgruppe)**

Result:

- do not show fields 2–6;
- do not show application submit;
- show direct-route CTA panel.

---

## Fördermitglied

Selection:

**Fördermitglied werden**

Result:

- do not show fields 2–6;
- do not show application submit;
- show membership CTA panel.

---

## Vereinsarbeit

These selections open fields 2–6:

```text
Social Media
Redaktion / Öffentlichkeitsarbeit
Rechtliche Unterstützung
Etwas anderes
```

---

# 19. Name

Label:

**Name**

Type:

```text
text
```

Required.

Use one field. Do not split first and last name.

---

# 20. E-Mail

Label:

**E-Mail**

Type:

```text
email
```

Required.

Example inline validation:

**Bitte gib eine E-Mail-Adresse ein, an die wir dir antworten können**

Avoid generic validation text.

---

# 21. Zeit pro Woche

Label:

**Zeit pro Woche**

Options:

```text
1–2 Stunden
3–5 Stunden
mehr als 5 Stunden
unregelmäßig, projektweise
```

Required.

---

# 22. Erzähl uns kurz von dir

Label:

**Erzähl uns kurz von dir**

Placeholder:

**Was bringst du mit, und was motiviert dich?**

Hint:

**Vier Sätze reichen. Wir lesen jede Bewerbung.**

Optional.

Recommended textarea minimum height:

```text
144px
```

Do not add a character counter unless the product later requires one.

---

# 23. Datenschutz

Required checkbox.

Exact copy:

**Ich bin damit einverstanden, dass ichbinhier e.V. meine Angaben zur Bearbeitung meiner Bewerbung speichert. [Datenschutzerklärung]**

`Datenschutzerklärung` must be visibly styled as a link.

The privacy copy must remain readable and must not be visually minimized.

---

# 24. Submit CTA

Button:

**Bewerbung abschicken**

Helper:

**Du erhältst sofort eine Bestätigungs-E-Mail mit allen weiteren Infos.**

Recommended primary button:

```text
Background       #e31119
Text             #ffffff
Height           56px
Radius            4px
Font size        20px
```

---

# 25. Fields That Must Not Exist

Do not add:

- phone;
- address;
- date of birth;
- CV upload;
- “Wie hast du von uns erfahren?”;
- languages;
- social media links;
- “Warum gerade ichbinhier?”;
- profile photo;
- cover letter;
- skill matrix;
- experience checklist.

These are intentionally excluded to protect conversion.

---

# 26. Required Figma States

Create 8 frames/variants.

```text
01 Initial
02 Aktionsgruppe
03 Vereinsarbeit
04 Confirmation
05 Validation Error
06 Loading
07 Mobile 375
08 Fördermitglied
```

The first four are mandatory for a complete design.

---

# 27. State 01 — Initial

Visible:

- heading;
- subheading;
- field 1;
- hint.

Hidden:

- fields 2–6;
- submit button.

The page must not look accidentally empty.

Use:

- typography;
- whitespace;
- halftone motif;
- small editorial illustration if needed.

Do **not** solve the empty state by adding more questions.

---

# 28. State 02 — Aktionsgruppe

Selected:

**Bei #ichbinhier mitmachen (Aktionsgruppe)**

Do not show fields 2–6.

Show a blue direct-action panel.

### Heading

**Du bist sofort dabei.**

### Body

**Kein Warten und keine Rückmeldung nötig: Tritt der Aktionsgruppe bei, lies die Regeln und wähle deinen ersten Thread. Beim ersten Mal antwortest du gemeinsam mit anderen, nie allein.**

### CTA

**Zur Aktionsgruppe →**

Suggested treatment:

```text
Background       soft blue
Text             #4f4f4f
Accent/title     blue
Radius           8px
Padding          36px
```

Blue is route-specific only; it is not a new primary brand color.

---

# 29. State 03 — Vereinsarbeit

Example selected route:

**Social Media**

Visible:

```text
Wie möchtest du uns helfen?
Name
E-Mail
Zeit pro Woche
Erzähl uns kurz von dir
Datenschutz
Bewerbung abschicken
```

Do not add numbered steps or progress indicators.

---

# 30. State 04 — Confirmation

Replace the editable form with a confirmation view.

### Heading

**Deine Bewerbung ist da!**

### Text

**Wir haben deine Angaben erhalten. Eine Bestätigungs-E-Mail mit allen weiteren Infos ist bereits unterwegs an [email].**

### Closing

**Vielen Dank für dein Interesse!**

Rules:

- one confirmation for all four Vereinsarbeit categories — there is no separate variant for Rechtliche Unterstützung;
- the only substitution is `[email]`, the address the applicant typed;
- emphasize `[email]` so a typo is noticeable — this is the one mistake that sends an applicant back into silence;
- the screen shows no date, no queue position and no next step: those belong to the confirmation email, and the server sends none of them to the form (see [`API.md`](./API.md));
- do not add vague reassurance beyond the specified copy.

---

# 32. State 05 — Validation Error

Errors appear directly below the relevant control.

Example:

**Bitte gib eine E-Mail-Adresse ein, an die wir dir antworten können**

Treatment:

```text
Field border    #e31119
Error text      #e31119
Error size      13px
Gap             ~7px
```

Do not use a generic red form banner as the only explanation.

Do not use color alone: error text must explicitly explain the issue.

---

# 33. State 06 — Loading

Button label:

**Wird abgeschickt …**

Requirements:

- include a small spinner/progress indicator;
- disable repeat submission;
- preserve form layout;
- keep the rest of the form visible;
- do not replace the page with a full-screen loader.

---

# 34. State 07 — Mobile 375px

Required frame:

```text
375px wide
```

Requirements:

- native select behaviour;
- vertical stacked controls;
- 54–56px field height;
- page gutter ~20px;
- full-width primary CTA;
- sticky submit area;
- readable privacy copy;
- desktop nav removed;
- safe-area inset respected.

The mobile design is not a reduced desktop screenshot. It must be designed as a first-class layout.

---

# 35. State 08 — Fördermitglied

Selected:

**Fördermitglied werden**

Do not show application fields.

### Heading

**Du unterstützt uns direkt.**

### Body

**Ohne Bewerbung und ohne Wartezeit: Wenn du Fördermitglied werden möchtest, findest du hier alle Informationen und den kurzen Antrag. So hilfst du, digitale Zivilcourage langfristig möglich zu machen.**

### CTA

**Zum Fördermitgliedsantrag →**

Suggested treatment:

```text
Background       very light purple/lila
Accent           #8437b6
Radius           8px
Padding          36px
```

It should clearly belong to the same routing system as the Aktionsgruppe panel.

---

# 36. Form Controls

Base:

```text
Height             56px
Border              1px
Border color        neutral gray
Background          white
Radius               4px
Horizontal padding  16px
Font size           20px
```

Hover:

```text
slightly darker border
```

Focus:

```text
Border             #8437b6
Focus ring         purple
```

Never use red for a normal focus state.

---

# 37. Textarea

```text
Minimum height     144px
Padding             16px
Radius               4px
Resize              vertical
```

Keep its width aligned to other controls.

---

# 38. Checkbox

Recommended:

```text
22 × 22px
Accent #8437b6
```

Align the checkbox to the first line of the privacy copy rather than vertically centering against the whole paragraph.

---

# 39. Buttons

## Primary

```text
Background #e31119
Text       #ffffff
```

Use for:

- `Bewerbung abschicken`

## Secondary

```text
Background #8437b6
Text       #ffffff
```

Use for secondary brand actions.

## Route blue

Use only in the Aktionsgruppe direct-route panel.

---

# 40. Accessibility

Every interactive element must have visible keyboard focus.

Recommended:

```css
outline: 2px solid #8437b6;
outline-offset: 3px;
```

Minimum tap target:

```text
44px
```

Preferred form control:

```text
54–56px
```

Validation must never rely on color alone.

Keep body and privacy copy readable against white and creme surfaces.

---

# 41. Mobile Sticky CTA

For the Vereinsarbeit route only.

Suggested structure:

```text
sticky container
  helper/status
  full-width button
```

Use:

- creme or slightly translucent creme background;
- subtle top border;
- no large floating shadow;
- safe-area bottom padding.

---

# 42. Responsive Rules

## Desktop > 1024px

```text
Page gutter      48px
Card padding    ~54px
Title            42px
```

## Tablet 641–1024px

```text
Page gutter      32px
Card padding    ~36px
```

## Mobile <= 640px

```text
Page gutter      20px
Card padding     24px
Title            36px
Controls         full width
Submit           sticky
```

---

# 43. Illustration Style

If supporting illustrations are used:

- use simple vector shapes;
- use red/purple/lila;
- keep them editorial;
- avoid generic stock icon packs;
- avoid 3D/glossy icons;
- avoid illustrations inside every input.

Suitable motifs:

- megaphone;
- speech;
- people/community;
- heart;
- hands;
- digital dialogue.

Illustrations are decorative/supporting, not functional controls.

---

# 44. Figma Variables

Create two collections.

## `ichbinhier / Primitive`

### Colors

```text
brand/red
brand/purple
brand/lila
brand/gray
brand/creme
base/white
```

### Typography

```text
font/small
font/medium
font/large
font/x-large
```

### Spacing

```text
spacing/20
spacing/30
spacing/40
spacing/50
spacing/60
spacing/70
spacing/80
```

---

## `ichbinhier / Semantic`

### Colors

```text
background/page
background/surface

text/primary
text/muted
text/inverse

action/primary
action/secondary

border/default
border/focus
border/error
```

### Components

```text
form/field-height
form/textarea-min-height
form/button-height

radius/control
radius/card
radius/panel
```

---

# 45. Figma Components

## Input

Variants:

```text
state=default
state=hover
state=focus
state=error
state=disabled
```

Properties:

```text
label
value
placeholder
hint
error
required
```

---

## Select

Variants:

```text
state=default
state=focus
state=error
state=disabled
```

Properties:

```text
label
selected-value
placeholder
hint
```

---

## Textarea

Variants:

```text
default
focus
error
disabled
```

---

## Checkbox

Variants:

```text
unchecked
checked
focus
error
disabled
```

---

## Button

Variants:

```text
type=primary
type=secondary
type=route-blue

state=default
state=hover
state=focus
state=loading
state=disabled

width=auto
width=full
```

---

## Route Panel

Variants:

```text
type=Aktionsgruppe
type=Fördermitglied
```

---

## Form

Variants:

```text
state=initial
state=Vereinsarbeit
state=validation-error
state=loading
state=submitted
```

---

# 46. Figma Frame Naming

Use:

```text
Form / Desktop / 01 Initial
Form / Desktop / 02 Aktionsgruppe
Form / Desktop / 03 Vereinsarbeit
Form / Desktop / 04 Confirmation
Form / Desktop / 05 Validation Error
Form / Desktop / 06 Loading
Form / Mobile / 07 Vereinsarbeit 375
Form / Desktop / 08 Fördermitglied
```

---

# 47. Prototype Flows

### Main application flow

```text
Initial
  ↓ Social Media
Vereinsarbeit
  ↓ Submit
Loading
  ↓ Success
Confirmation
```

### Aktionsgruppe flow

```text
Initial
  ↓ Aktionsgruppe
Aktionsgruppe direct route
  ↓ CTA
External destination
```

### Fördermitglied flow

```text
Initial
  ↓ Fördermitglied
Fördermitglied direct route
  ↓ CTA
Membership destination
```

---

# 48. Motion

Motion should be restrained.

### Revealing Vereinsarbeit fields

```text
150–220ms
ease-out
opacity + small vertical movement
```

Reveal the block together. Do not animate each field slowly.

### Route panel

```text
150–200ms fade/slide
```

### Loading

Use a small spinner only.

---

# 49. Content Rules

Use the specified German copy exactly.

Do not:

- rewrite CTAs;
- change `du` to `Sie`;
- introduce formal HR language;
- use vague confirmation copy;
- add marketing claims not provided in the specification.

Tone:

- direct;
- human;
- concise;
- concrete.

---

# 50. Information Hierarchy

Priority:

```text
1. ichbinhier lebt vom Mitmachen.
2. two-minute promise
3. route selector
4. route outcome
5. only necessary fields
6. concrete next step
```

Avoid competing CTAs above the form.

---

# 51. UX Principle

The interface should clearly communicate:

> **Choose your route first. We only ask what is necessary after that.**

Field 1 is therefore the core structural element of the page, not merely the first form control.

---

# 52. Do / Don't

## Do

- use exact brand colors;
- use Akhand Soft;
- use red headings;
- use creme page background;
- use purple/lila halftone details;
- keep the form minimal;
- maintain clear vertical rhythm;
- make direct routes obvious;
- treat mobile as first-class;
- show concrete next steps.

## Don't

- add a SaaS dashboard style;
- use Material UI defaults;
- add giant rounded cards;
- add extra application fields;
- add progress steps;
- add floating labels;
- put icons in every input;
- use generic error banners;
- hide the next step after submission.

---

# 53. Design Review Checklist

- [ ] Exact brand colors used
- [ ] Akhand Soft used
- [ ] Page title is red
- [ ] Page background is creme
- [ ] Purple/lila halftone language appears
- [ ] Only six fields exist
- [ ] Initial state shows only field 1
- [ ] Aktionsgruppe bypasses application submission
- [ ] Fördermitglied bypasses application submission
- [ ] Vereinsarbeit reveals fields 2–6
- [ ] Datenschutz checkbox is required
- [ ] Errors are inline and specific
- [ ] Loading prevents duplicate submission
- [ ] Confirmation names the email address the applicant entered
- [ ] Confirmation is identical for all four Vereinsarbeit categories
- [ ] 375px mobile frame exists
- [ ] Mobile CTA is full-width and sticky
- [ ] Mobile select preserves native behaviour
- [ ] No excluded fields are present

---

# 54. Final Direction

This project is not a redesign of ichbinhier.

It is a form extension of the existing design language.

The final interface should be recognizable as ichbinhier through:

- Akhand Soft typography;
- red editorial headings;
- purple/lila graphic language;
- creme background;
- direct conversational copy;
- existing spacing rhythm;
- minimal form complexity.

The most important outcome is:

> **The user immediately understands where to go and only sees the information that is truly necessary.**

---

## Related Files

Use together:

```text
DESIGN.md
token.json
API.md
src/styles/tokens.css
```

- `DESIGN.md` — behaviour, composition, UX rules, and Figma structure.
- `token.json` — design variables and token source, and the input for Figma variables.
- [`API.md`](./API.md) — what the form sends to the backend and what it gets back.
- `src/styles/tokens.css` — the implemented token layer. Every value in the code resolves to a variable from this file; literal colours and sizes in component CSS are rejected by the linter.

The former `theme.css` has been split: its `:root` block is now `src/styles/tokens.css`, its reset is `src/styles/base.css`, and its component classes live in the CSS module of the component they style. Keeping a second copy of component styling outside the components would guarantee the two drift apart.
