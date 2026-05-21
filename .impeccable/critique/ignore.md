# Critique ignore list

Findings the deterministic detector raises that have been reviewed and
explicitly accepted. /impeccable critique runs drop any finding whose
text matches a line here (case-insensitive substring against rule name
or snippet).

## Accepted findings

overused-font
# Fraunces and Inter are deliberately chosen via ADR-0004 and DESIGN.md.
# The Publication-Mast Rule defines exactly how Fraunces is used
# (upright only, never italic, never decorative flourish). The detector
# can't know rule-bound context; the choice was made through 12 grilling
# rounds with the user and is locked.
