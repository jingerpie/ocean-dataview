# URL State Encoding Rules

This document defines the rules for encoding application state in URL parameters using a human-readable DSL format instead of JSON.

## Core Principles

1. **Human-readable** - URLs should be understandable at a glance
2. **Standard URL encoding** - Use percent-encoding for special characters
3. **Compact** - Minimize URL length
4. **Reversible** - Parse and serialize without data loss
5. **Type-safe** - Preserve type information (strings, numbers, booleans)

---

## Reserved Characters

| Character | Use | URL Encode In Values |
|-----------|-----|---------------------|
| `.` | Field separator | `%2E` |
| `,` | Array item separator | `%2C` |
| `(` `)` | Expression grouping | `%28` `%29` |
| `:` | Key-value separator (optional) | `%3A` |

---

## Basic Value Encoding

### Strings
```
hello           → hello
Hello World     → Hello%20World    (space → %20)
foo.bar         → foo%2Ebar        (escape dot)
foo,bar         → foo%2Cbar        (escape comma)
```

### Numbers
```
42              → 42
-15             → -15
3.14            → 3.14
```

### Booleans
```
true            → true
false           → false
```

### Null/Undefined
```
null            → (omit from URL entirely)
undefined       → (omit from URL entirely)
```

---

## CSV-Style Quoting

Values containing special characters are wrapped in double quotes.
Literal quotes inside quoted values are escaped by doubling them.

| Value | Encoded |
|-------|---------|
| `hello` | `hello` |
| `v1.0.0` | `"v1.0.0"` |
| `Smith, John` | `"Smith, John"` |
| `say "hi"` | `"say ""hi"""` |
| `(test)` | `"(test)"` |

---

## Arrays

### Simple Arrays
Arrays are comma-separated:
```ts
["a", "b", "c"]  →  a,b,c
[1, 2, 3]        →  1,2,3
```

### Empty Array
```ts
[]               →  (empty string or omit parameter)
```

### Single Item Array
```ts
["only"]         →  only
```

### Arrays with Special Characters
```ts
["a,b", "c"]     →  "a,b",c
["a.b", "c"]     →  "a.b",c
```

---

## Tuples (Positional Arrays)

Dot-separated for fixed-position data:
```ts
["name", "asc"]           →  name.asc
["price", "eq", 100]      →  price.eq.100
["status", "eq", "active"] →  status.eq.active
```

### Multiple Tuples
Comma-separated list of dot-separated tuples:
```ts
[["name", "asc"], ["price", "desc"]]  →  name.asc,price.desc
```

---

## Objects

### Simple Key-Value Objects
```ts
{ property: "name" }                  →  name
{ property: "status", value: "active" } →  status.active
```

### Discriminated Union Objects
Use type prefix:
```ts
{ bySelect: { property: "status" } }           →  select.status
{ byMultiSelect: { property: "tags" } }        →  multiselect.tags
{ byDate: { property: "created", showAs: "month" } } →  date.created.month
{ byNumber: { property: "price", min: 0, max: 100, step: 10 } }
  →  number.price.0.100.10
```

### Complex Objects with Options
Use colon for optional key-value pairs:
```ts
{ byStatus: { property: "status", showAs: "option" }, sort: "desc" }
  →  status.status.option:sort:desc

// Alternative format:
  →  status.status.option,sort.desc
```

---

## Nested/Recursive Structures

### Filter Expressions
Use parentheses for grouping:
```ts
// Simple rule
{ property: "name", condition: "eq", value: "test" }
  →  name.eq.test

// AND expression
{ and: [rule1, rule2] }
  →  and(rule1,rule2)

// OR expression
{ or: [rule1, rule2] }
  →  or(rule1,rule2)

// Nested expression
{ and: [
  { property: "name", condition: "iLike" },
  { or: [
    { property: "status", condition: "eq" },
    { property: "type", condition: "eq" }
  ]}
]}
  →  and(name.iLike,or(status.eq,type.eq))
```

### Top-Level Array of Filters
Implicit AND at root level:
```ts
[
  { and: [...] },
  { property: "price", condition: "eq" },
  { property: "featured", condition: "eq", value: true }
]
  →  and(...),price.eq,featured.eq.true
```

---

## Parameter-Specific Rules

### Sort (`sort`)
```
Input:  [{ property: "name", direction: "asc" }, { property: "price", direction: "desc" }]
Output: name.asc,price.desc
```

### Group (`group`)
```
Input:  { byMultiSelect: { property: "tags" }, sort: "desc", hideEmpty: true }
Output: multiselect.tags:sort:desc:hideEmpty
```

### Expanded (`expanded`)
```
Input:  ["group-a", "group-b", "group-c"]
Output: group-a,group-b,group-c
```

### Cursor (`cursor`)
```
Input:  { after: "abc123", start: 10 }
Output: after.abc123.10

Input:  { before: "xyz789", start: 20 }
Output: before.xyz789.20
```

### Cursors (`cursors`) - Per-Group Cursors
```
Input:  { "groupA": { after: "abc", start: 10 }, "groupB": { before: "xyz", start: 20 } }
Output: groupA.after.abc.10,groupB.before.xyz.20
```

### Filter (`filter`)
```
Input:  [
  { and: [
    { property: "name", condition: "iLike" },
    { or: [
      { property: "status", condition: "eq", value: "active" },
      { property: "type", condition: "eq", value: "premium" }
    ]}
  ]},
  { property: "price", condition: "gt", value: 100 }
]
Output: and(name.iLike,or(status.eq.active,type.eq.premium)),price.gt.100
```

---

## Parsing Rules

### Tokenization
1. Split by `,` (respecting parentheses depth and quoted values)
2. Split each item by `.` (dots inside quoted values are not split)
3. Unquote values and unescape doubled quotes

### Type Inference
Parse values in this order:
1. `true` / `false` → boolean
2. Numeric pattern → number
3. Everything else → string

### Expression Parsing
1. Check for `and(` or `or(` prefix
2. Find matching closing `)`
3. Recursively parse contents

---

## Edge Cases

### Empty Values
```ts
{ property: "name", condition: "isEmpty" }  →  name.isEmpty
// No value field, so only property.condition
```

### Boolean Values
```ts
{ property: "active", condition: "eq", value: true }   →  active.eq.true
{ property: "active", condition: "eq", value: false }  →  active.eq.false
```

### Numeric Values
```ts
{ property: "price", condition: "gt", value: 99.99 }   →  price.gt.99.99
{ property: "count", condition: "eq", value: 0 }       →  count.eq.0
```

### String Values That Look Like Numbers
```ts
{ property: "code", condition: "eq", value: "007" }    →  code.eq.$s007
// $s prefix indicates string type preservation
```

---

## Migration Strategy

1. **Read**: Accept both old JSON format and new DSL format
2. **Write**: Always write new DSL format
3. **Redirect**: Optionally redirect old URLs to new format (301)

### Detection
- Old format starts with `[` or `{`
- New format uses dots and commas without brackets

---

## Examples

### Before (JSON)
```
?filter=[{"and":[["productName","iLike"],{"or":[["status","eq","active"]]}]}]
&sort=[["name","asc"],["price","desc"]]
&group={"byMultiSelect":{"property":"tags"},"sort":"desc"}
&expanded=["group-a","group-b"]
```

### After (DSL)
```
?filter=and(productName.iLike,or(status.eq.active))
&sort=name.asc,price.desc
&group=multiselect.tags:sort:desc
&expanded=group-a,group-b
```

### URL Length Comparison
| State | JSON Format | DSL Format | Savings |
|-------|-------------|------------|---------|
| Simple filter | ~80 chars | ~30 chars | 62% |
| Complex filter | ~200 chars | ~80 chars | 60% |
| Full state | ~400 chars | ~150 chars | 62% |
