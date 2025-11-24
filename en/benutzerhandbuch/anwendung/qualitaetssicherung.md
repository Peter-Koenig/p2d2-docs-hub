---
quality:
  completeness: 50
  accuracy: 70
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Quality Assurance

Quality Assurance (QA) is a central component of p2d2. It ensures that only correct and complete data is transferred to public platforms.

## The Four-Eyes Principle

p2d2 relies on the **Four-Eyes Principle**:

1. **Collector**: Creates or modifies feature
2. **Reviewer**: Checks the change
3. **Approval**: Only after review is the feature exported

## QA Workflow

### 1. Feature is Submitted for QA

- Status changes to **"In QA"**
- Feature appears in **QA queue**
- Notification to QA team

### 2. Reviewer Selects Feature

QA reviewers see:

- **Change List**: What was changed?
- **Before/After Comparison**: Side-by-side view
- **Change Comment**: Justification for the change
- **Sources**: Specified information sources

### 3. Review

The reviewer checks:

- **Geometry**: Is the shape correct and precise?
- **Attributes**: Are all information complete and correct?
- **Sources**: Are the specified sources permitted?
- **Consistency**: Do the data fit with neighboring features?

### 4. Decision

Three options:

#### Approve ✅

- Feature is correct
- Marked for export
- Collector receives notification

#### Reject ❌

- Feature has deficiencies
- **Justification required**
- Returns to collector for revision

#### Query ❓

- Uncertainty during review
- Discussion in comments
- Additional reviewers can be consulted

## QA Criteria

### Geometry Quality

- **Accuracy**: Min. 1 meter
- **Topology**: No self-intersections
- **Completeness**: All relevant features collected

### Attribute Quality

- **Completeness**: Required fields filled
- **Format**: Correct formatting (URLs, phone numbers, etc.)
- **Consistency**: No contradictions within the feature

### Source Quality

- **Permissibility**: Only permitted sources used
- **Timeliness**: Most current information possible
- **Traceability**: Sources are specified

## QA Roles

### QA Beginner

- **Permission**: Can submit own features for QA
- **Restriction**: Cannot yet perform QA

### QA Reviewer

- **Permission**: Can perform QA
- **Requirement**: Min. 50 successful own features
- **Rights**: Approve, reject, query

### QA Moderator

- **Permission**: Can resolve QA conflicts
- **Rights**: All reviewer rights + conflict resolution
- **Role**: Contact person for uncertainties

## Automatic Checks

In addition to manual QA, there are **automatic checks**:

### Geometry Validation

- **Closed Polygons**: Polygons must be closed
- **Minimum Size**: Features must have minimum size
- **Bounding Box**: Features must be in permitted area

### Attribute Validation

- **Required Fields**: Must be filled
- **Format**: URLs, emails, phone numbers are validated
- **Value Range**: Numeric values must be in permitted range

### Duplicate Detection

- **Spatial**: Warning for overlapping features
- **Attribute**: Warning for identical names nearby

::: tip Become QA Reviewer
Interested in QA? After 50 successful own features, you can apply as a QA reviewer!
:::

## QA Dashboard

The QA dashboard shows:

- **Queue**: Features waiting for QA
- **My Reviews**: Features reviewed by me
- **Statistics**: QA processing times, rejection rates
- **Trends**: Common error types

## Feedback Culture

When rejecting:

- **Constructive**: Explain what needs improvement
- **Specific**: Name specific problems
- **Helpful**: Provide hints for improvement

::: warning Quality Over Quantity
QA reviewers should check carefully, not quickly approve!
:::