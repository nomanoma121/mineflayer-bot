# BotScript Examples

## Basic Commands
```botscript
SAY "Hello World"
MOVE "forward" 5
GOTO 100 64 200
```

## Variables and Logic
```botscript
DEF $health = 20
DEF $maxHealth = 20

IF $health < $maxHealth / 2 THEN
  SAY "Low health warning!"
ENDIF
```

## Loops
```botscript
DEF $count = 0
REPEAT 10
  SAY "Count: " + $count
  $count = $count + 1
  WAIT 1
ENDREPEAT
```

## Combat Script
```botscript
DEF $target = "zombie"
DEF $attacks = 0

REPEAT 5
  ATTACK $target
  $attacks = $attacks + 1
  SAY "Attack " + $attacks + " completed"
  WAIT 2
ENDREPEAT
```

## Mining Script
```botscript
DEF $blocks = 0
REPEAT 64
  DIG "stone"
  $blocks = $blocks + 1
  IF $blocks % 10 = 0 THEN
    SAY "Mined " + $blocks + " blocks"
  ENDIF
  WAIT 1
ENDREPEAT
```

## Building Script
```botscript
DEF $x = 100
DEF $y = 64
DEF $z = 200

REPEAT 10
  GOTO $x $y $z
  PLACE "stone"
  $x = $x + 1
ENDREPEAT
```
