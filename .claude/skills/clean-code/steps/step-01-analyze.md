---
name: step-01-analyze
description: Phase d'analyse - identifier tous les problèmes de qualité
next_step: steps/step-02-prioritize.md
---

# Phase 1: Analyze

**Role: CODE AUDITOR** - Systematic identification of all code quality issues

---

<available_state>
From SKILL.md entry point:
- `{target}` - File(s) or directory to clean
- `{scope}` - file | directory | project
- `{economy_mode}` - If true, use direct tool calls instead of subagents
</available_state>

---

<mandatory_rules>
## RÈGLES OBLIGATOIRES POUR CETTE PHASE

- 🔍 SCAN exhaustively - check every category of issues
- 📊 QUANTIFY problems - count occurrences, measure complexity
- 🎯 BE SPECIFIC - exact file:line for each issue
- 📋 CATEGORIZE clearly - group by type for prioritization
- 🚫 FORBIDDEN: Making any changes during analysis
</mandatory_rules>

---

## Actions

### 1.1 Lancer l'analyse parallèle

```
[PARALLEL AGENTS - Full audit mode]

Agent 1 - Dead Code Hunter:
==========================
Mission: Find all unused code
- Search for unused exports: `grep -r "export" | check imports`
- Find unused imports in each file
- Identify dead branches (unreachable code)
- Find commented-out code blocks
- Locate empty functions/classes
- Detect unused variables

Agent 2 - Duplication Detector:
==============================
Mission: Find duplicated code and patterns
- Identify copy-pasted blocks (>5 similar lines)
- Find repeated logic patterns
- Detect redundant utility functions
- Spot similar error handling patterns

Agent 3 - Complexity Analyzer:
=============================
Mission: Measure and identify complex code
- Count function lengths (flag >50 lines)
- Measure file sizes (flag >300 lines)
- Check nesting depth (flag >3 levels)
- Identify cyclomatic complexity hotspots
- Find god classes/modules

Agent 4 - Convention Checker:
============================
Mission: Find naming and style violations
- Check variable naming (flag: x, temp, data, etc.)
- Verify function naming conventions
- Detect inconsistent patterns
- Find magic numbers/strings
- Check for TODO/FIXME comments

Agent 5 - TypeScript Inspector:
==============================
Mission: Find type-related issues
- Count `any` usage
- Find missing type annotations
- Detect unnecessary type assertions
- Check for type inconsistencies
- Find `@ts-ignore` comments
```

### 1.2 Analyse statique

```bash
# ESLint avec règles strictes
npx eslint {target} --format json > /tmp/eslint-report.json

# TypeScript strict check
npx tsc --noEmit --strict 2>&1 | grep {target}

# Détection de code mort (si knip installé)
npx knip --include files,exports,types

# Complexité (si disponible)
npx complexity-report {target}
```

### 1.3 Collecter les métriques

Pour chaque fichier analysé, collecte :

```typescript
interface FileMetrics {
  path: string;
  lines: number;
  functions: number;
  maxFunctionLength: number;
  maxNestingDepth: number;
  anyCount: number;
  unusedExports: string[];
  unusedImports: string[];
  duplicateBlocks: number;
  todoCount: number;
  complexityScore: number;
}
```

---

## Output de cette phase

```markdown
## Analysis Report

### Scope
- Target: `{target}`
- Files analyzed: [X]
- Total lines: [X]

### Issues Summary
| Category | Count | Severity |
|----------|-------|----------|
| Dead Code | [X] | Low |
| Unused Imports | [X] | Low |
| Duplication | [X] | Medium |
| Long Functions | [X] | Medium |
| Deep Nesting | [X] | Medium |
| Poor Naming | [X] | Low |
| Any Types | [X] | Medium |
| TODOs | [X] | Low |

### Detailed Issues

#### 🗑️ Dead Code
| File | Line | Type | Description |
|------|------|------|-------------|
| [...] | [...] | unused export | `functionName` not imported anywhere |
| [...] | [...] | commented code | 15 lines of commented code |

#### 📋 Duplication
| Files | Lines | Similarity |
|-------|-------|------------|
| file1.ts:10-25, file2.ts:30-45 | 15 | 90% |

#### 🏗️ Structure
| File | Metric | Value | Threshold |
|------|--------|-------|-----------|
| [...] | function length | 85 lines | 50 |
| [...] | nesting depth | 5 | 3 |

#### 📝 Naming Issues
| File | Line | Current | Suggested |
|------|------|---------|-----------|
| [...] | [...] | `x` | `userCount` |
| [...] | [...] | `temp` | `processingResult` |

#### 🔧 TypeScript
| File | Line | Issue |
|------|------|-------|
| [...] | [...] | `any` type used |
| [...] | [...] | missing return type |

### Metrics per File
| File | Lines | Functions | Complexity | Issues |
|------|-------|-----------|------------|--------|
| [...] | [...] | [...] | [...] | [...] |
```

---

→ **Next**: `step-02-prioritize.md` - Rank and plan improvements
