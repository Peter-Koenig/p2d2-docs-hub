---
quality:
  completeness: 50
  accuracy: 70
  reviewed: false
  reviewer: null
  reviewDate: null
---

# Saving

Saving changes in p2d2 follows a structured process to prevent data loss and enable quality assurance.

## Save Workflow

### 1. Local Saving

During editing, changes are saved **locally in the browser**:

- **Automatically**: Every 30 seconds
- **Manually**: Ctrl + S or "Save" button
- **Browser Storage**: IndexedDB

::: tip Auto-Save
You don't need to save manually - the application automatically saves your work.
:::

### 2. Mark Changes

Edited features are marked:

- **Yellow**: Unsaved local changes
- **Orange**: Marked for quality assurance
- **Green**: Quality assured, ready for export

### 3. Submit for Quality Assurance

When you're satisfied with your work:

1. **Select Feature**
2. **"Submit for QA"**: Button in the sidebar
3. **Comment**: Describe changes
4. **Confirm**

The feature is now submitted to the **community for review**.

## Storage Locations

### Browser (IndexedDB)

- **Local Cache**: For offline editing
- **Automatic Synchronization**: When online connection
- **Versioning**: Multiple editing states

### Server (PostgreSQL/PostGIS)

- **After QA Submission**: Data is transferred to server
- **Versioning**: Git-like change history
- **Backup**: Daily backups

### Export

After successful quality assurance:

- **OpenStreetMap**: Via OSM-API
- **WikiData**: Via WikiData-API
- **OpenData Portal**: Feedback to administration

## Conflict Handling

### Simultaneous Editing

When multiple users edit the same feature:

1. **Warning**: "Feature is already being edited"
2. **Options**:
   - Wait until other user is finished
   - Read-only mode
   - Force conflict (for admins)

### Version Conflict

In case of version conflicts (server has newer version):

1. **Merge Dialog**: Shows both versions
2. **Comparison**: Side-by-side view
3. **Resolution**:
   - Adopt server version
   - Prefer local version
   - Manual merge

## Undo

### Before Submission

- **Ctrl + Z**: Undo single change
- **"Discard"**: Discard all changes of a feature

### After Submission

- **Only by Admins**: Submitted changes can only be reverted by moderators
- **Justification Required**: Why should the change be reverted?

## Offline Mode

p2d2 supports **offline editing**:

1. **Synchronize Data**: Before going offline
2. **Edit Offline**: All functions available
3. **Synchronization**: Changes are uploaded once online connection exists

::: warning Avoid Data Loss
Do not delete browser cache while unsaved changes exist!
:::

## Best Practices

- **Submit Regularly**: Submit changes regularly for QA instead of accumulating large batches
- **Comments**: Describe your changes meaningfully
- **Check Before Submission**: Review your work yourself before submitting
- **Backup**: For extensive changes: Export as GeoJSON for safety