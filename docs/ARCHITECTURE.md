# Architecture Overview

## Core Components

### 1. Data Injection Layer

**Purpose**: Intercept and modify graph data before rendering

```javascript
injectGraphLeaf(graphLeaf, graphType) {
  // Save original setData method
  renderer.originalSetData = renderer.setData;
  
  // Replace with wrapper
  renderer.setData = function(data) {
    const modifiedData = deepCopy(data);
    plugin.processNestedTags(modifiedData);
    plugin.expandTagFiles(modifiedData);
    return renderer.originalSetData.call(this, modifiedData);
  };
}
```

**Key Design Decisions**:
- Deep copy data to avoid pollution
- Preserve `this` context with `call()`
- Use WeakSet to track injected renderers

### 2. Data Processing Layer

#### Nested Tags Processing

Parses tag IDs to create parent-child relationships:
```
Input:  #work/project/task
Output: #work → #work/project → #work/project/task
```

Algorithm:
- Scan tag ID from right to left for `/` separators
- Create parent tag nodes if they don't exist
- Create links from parent to child (not child to parent!)

#### Tag File Expansion

Links tag nodes to files containing those tags:
```
Input:  Tag node #project
Output: #project ↔ file1.md ↔ file2.md
```

Algorithm:
- Scan all markdown files in vault
- Check frontmatter and inline tags
- Exact match only (no parent/child matching)
- Create bidirectional links
- Add file nodes if not in graph

### 3. Refresh Mechanism

**Problem**: Different graph types require different refresh methods

**Solution**: Type-specific refresh
```javascript
refreshGraph(graphLeaf) {
  if (viewType === 'graph') {
    view.onunload();  // Global graph
    view.onload();
  } else if (viewType === 'localgraph') {
    view.engine.render();  // Local graph
  }
}
```

**Debouncing**: Prevent infinite loops
- Track last refresh time per leaf
- 1-second cooldown between auto-refreshes
- Skip cooldown for user actions

### 4. UI Integration Layer

**Structure**: Matches Obsidian's native tree-based controls

```html
<div class="setting-item mod-toggle">
  <div class="setting-item-info">
    <div class="setting-item-name">嵌套标签</div>
  </div>
  <div class="setting-item-control">
    <div class="checkbox-container is-enabled"></div>
  </div>
</div>
```

**Key Features**:
- Insert as sibling of Tags toggle
- Monitor parent state with MutationObserver
- Sync state from settings (not local variables)
- Update all windows on change

### 5. State Management

**Single Source of Truth**: `plugin.settings`

```javascript
{
  enableNestedTags: boolean,
  enableTagFileExpansion: boolean,
  enableForGlobalGraph: boolean,
  enableForLocalGraph: boolean
}
```

**State Flow**:
```
User Action
  ↓
Update Settings
  ↓
Save to Disk
  ↓
Broadcast to All Windows
  ↓
Refresh Graphs
```

## Event Handling

### Initialization

```
onLayoutReady
  ↓
Inject at multiple intervals (200ms, 500ms, 1000ms, 2000ms)
  ↓
Refresh all graphs
```

**Why multiple intervals**: Graph views may load at different times

### Runtime Events

1. **layout-change**: Graph opened/closed
   - Inject into new graphs
   - Refresh global graphs with cooldown

2. **active-leaf-change**: Tab switched
   - Inject if graph view
   - Refresh newly activated graph

## Design Patterns

### Pattern 1: Defensive Programming

```javascript
// Always check before using
if (obj && typeof obj.method === 'function') {
  obj.method();
} else {
  fallbackMethod();
}
```

### Pattern 2: Multi-tier Fallback

```javascript
element = 
  primarySelector() ||
  secondarySelector() ||
  createFallback();
```

### Pattern 3: State Synchronization

```javascript
// Read from single source
const syncState = () => {
  const current = plugin.settings.value;
  updateUI(current);
  return current;
};

// Use before operations
onClick(() => {
  const current = syncState();
  doOperation(!current);
});
```

## Performance Considerations

### Memory Management

- **WeakSet** for tracking injections (automatic GC)
- **Map** for refresh timestamps (manual cleanup not needed for reasonable sizes)
- Remove event listeners in `onunload()`

### Refresh Optimization

- Debouncing prevents excessive refreshes
- User actions skip debouncing for responsiveness
- Only refresh graphs that are actually open

### Data Processing

- Process only tag nodes (skip files/attachments)
- Cache file metadata lookups via `metadataCache`
- Avoid scanning all files repeatedly (only during expansion)

## Known Limitations

1. **Performance**: Tag file expansion scans entire vault (acceptable for < 10k files)
2. **UI Structure**: Depends on Obsidian's UI structure (may break on major updates)
3. **Graph Types**: Only supports 'graph' and 'localgraph' view types

## Future Improvements

Potential enhancements:
- Configurable tag matching rules (exact vs hierarchical)
- Performance optimization for large vaults
- Caching for file-tag relationships
- Custom styling options
- Filter controls for expansion depth

---

For more technical details, see the code comments in `main.js`.

