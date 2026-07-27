# Image Similarity Graph — Index Statistics

> Phase 3.5 local index. No AI-Vision call, canon assignment or production
> integration was performed.

## Scope and gate

- Nodes: 132/132
- Pairwise comparisons: 8,646
- Stored edges: 1,509
- pHash edges: 728
- Color-layout edges: 781
- Nodes with neighbors: 132
- Possible duplicate pairs: 3
- Canonical edges: 0
- Production integration: `blocked_pending_approval`
- Index size: approximately 793 KiB

The index stores each algorithm as an independent edge. All edges are
`verificationState: analyzed` and `canonical: false`.

## Score distribution

### pHash

- Minimum: 0.312500
- Maximum: 1.000000
- Mean: 0.532251
- Median: 0.531250
- Selection: top 8 per node plus score ≥ 0.820000

### Color layout

- Minimum: 0.714028
- Maximum: 1.000000
- Mean: 0.908877
- Median: 0.929306
- Selection: top 8 per node plus score ≥ 0.975000

The color threshold is deliberately above the corpus median. Caelinus boards
share a dark/gold art direction, so a lower color threshold creates a dense and
low-information graph.

## Strongest multi-algorithm pairs

1. `IMG-CAEL-0082` ↔ `IMG-CAEL-0083`
   - pHash: 1.000000
   - color layout: 1.000000
   - SHA-256 equal: yes
2. `IMG-CAEL-0107` ↔ `IMG-CAEL-0112`
   - pHash: 1.000000
   - color layout: 1.000000
   - SHA-256 equal: yes
3. `IMG-CAEL-0069` ↔ `IMG-CAEL-0070`
   - pHash: 0.968750
   - color layout: 0.985872
   - SHA-256 equal: no
4. `IMG-CAEL-0066` ↔ `IMG-CAEL-0067`
   - pHash: 0.937500
   - color layout: 0.973433
5. `IMG-CAEL-0130` ↔ `IMG-CAEL-0132`
   - pHash: 0.906250
   - color layout: 0.990115
6. `IMG-CAEL-0126` ↔ `IMG-CAEL-0130`
   - pHash: 0.906250
   - color layout: 0.984273
7. `IMG-CAEL-0119` ↔ `IMG-CAEL-0120`
   - pHash: 0.906250
   - color layout: 0.981545

These are similarity candidates, not editorial duplicate decisions. No file was
deleted, merged, renamed or marked canonical.

## Limitations

- pHash captures low-frequency visual structure, not lore or semantic meaning.
- Color layout captures coarse palette placement; shared art direction can
  inflate similarity.
- Exact SHA equality is strong duplicate evidence but still requires archive
  owner approval before any content action.
- Sequence, production-page and concept-art relationships are not created by
  this index. They require a separate human-approved review layer.
