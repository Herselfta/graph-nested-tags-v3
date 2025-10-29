# Development Guide

## Prerequisites

- Obsidian (latest version recommended)
- Basic understanding of JavaScript
- Familiarity with Obsidian's plugin system

## Development Workflow

### 1. Setup

```bash
# Clone the repository
git clone https://github.com/Herselfta/graph-nested-tags-v3.git

# Navigate to your vault's plugin directory
cd /path/to/your/vault/.obsidian/plugins/

# Create symbolic link or copy files
cp -r /path/to/graph-nested-tags ./graph-nested-tags
```

### 2. Making Changes

1. Edit `main.js`
2. Reload Obsidian: `Ctrl/Cmd + P` → "Reload app"
3. Test your changes
4. Check console for errors: `Ctrl/Cmd + Shift + I`

### 3. Testing

#### Manual Testing

1. **Global Graph**
   - Open graph view
   - Verify nested tags display
   - Verify tag-file connections
   - Test UI controls in Filters section

2. **Local Graph**
   - Open local graph for a note
   - Verify same features work
   - Test UI controls

3. **Multi-window**
   - Open multiple graph views
   - Change settings in one
   - Verify sync in others

#### Debugging Tips

**Enable verbose logging** (already enabled in v3.1):
```javascript
// All actions log to console with [Graph Nested Tags] prefix
```

**Inspect graph data**:
```javascript
const leaf = app.workspace.getActiveViewOfType('graph');
const renderer = leaf.view.renderer;

// Hook into setData to see data structure
const original = renderer.setData;
renderer.setData = function(data) {
  console.log('Graph data:', data);
  return original.call(this, data);
};
```

**Test refresh methods**:
```javascript
const leaf = app.workspace.activeLeaf;
const plugin = app.plugins.plugins['graph-nested-tags'];

// Test plugin's refresh
plugin.refreshGraph(leaf);

// Compare with manual refresh
if (leaf.view.getViewType() === 'graph') {
  leaf.view.onunload();
  leaf.view.onload();
} else if (leaf.view.getViewType() === 'localgraph') {
  leaf.view.engine.render();
}
```

## Architecture Decisions

### Why Different Refresh Methods?

**Global Graph**: 
- Uses `onunload/onload` cycle
- Triggers complete data reload
- Calls `setData` with fresh data

**Local Graph**:
- Uses `engine.render()`
- Triggers data recomputation
- `onunload/onload` doesn't trigger `setData` for local graphs

**Discovery Process**:
- Tested multiple methods (requestRebuild, onload, render, etc.)
- Observed which triggered `setData` calls
- Verified which actually refreshed the graph
- Selected proven methods for each graph type

### Why Debouncing?

**Problem**: Refresh triggers `layout-change` → triggers refresh → infinite loop

**Solution**:
```javascript
lastRefreshTime = new Map();
cooldown = 1000ms;

// Auto-refresh: respect cooldown
refreshGraph(leaf, skipCooldown = false)

// User action: skip cooldown for instant response
onClick(() => refreshGraph(leaf, true))
```

### Why WeakSet for Injection Tracking?

**Alternatives considered**:
- `Set`: Strong reference, potential memory leak
- `Array`: Requires manual cleanup
- Flag on object: Pollutes object

**Chosen**: `WeakSet`
- Weak reference, automatic garbage collection
- Clean API (`has`, `add`, `delete`)
- No memory leaks

### Why Deep Copy Data?

**Problem**: Modifying original data affects other plugins and Obsidian core

**Solution**:
```javascript
const modifiedData = {
  nodes: {},
  links: data.links || {}
};

for (const id in data.nodes) {
  modifiedData.nodes[id] = {
    ...data.nodes[id],
    links: {...data.nodes[id].links}  // Deep copy nested objects
  };
}
```

## Common Issues and Solutions

### Issue: Refresh not working

**Diagnosis**:
```javascript
// Check if methods exist
console.log('view.onunload:', typeof leaf.view.onunload);
console.log('view.onload:', typeof leaf.view.onload);
console.log('view.engine:', leaf.view.engine);
console.log('view.engine.render:', typeof leaf.view.engine?.render);
```

**Solution**: Use the correct method for the graph type

### Issue: UI not appearing

**Diagnosis**:
```javascript
// Check UI structure
const controls = leaf.view.containerEl.querySelector('.graph-controls');
const sections = controls.querySelectorAll('.graph-control-section');
sections.forEach((s, i) => {
  console.log(`Section ${i}:`, s.querySelector('.graph-control-section-header')?.textContent);
});
```

**Solution**: Adapt to actual UI structure, provide fallbacks

### Issue: Settings not applying

**Diagnosis**:
```javascript
// Check if setData is called after settings change
// Should see console log: [Graph Nested Tags] setData called
```

**Solution**: Ensure refresh is actually triggered

## Testing Checklist

Before submitting PR:

- [ ] Global graph works on first open
- [ ] Local graph works on first open
- [ ] UI controls appear in both graph types
- [ ] UI controls under Tags toggle (as sub-items)
- [ ] UI controls hide when Tags toggle is off
- [ ] Toggles refresh graph immediately
- [ ] Multi-window state sync works
- [ ] Settings panel works
- [ ] Command palette commands work
- [ ] No infinite refresh loops
- [ ] No console errors
- [ ] Tag matching is exact (no overflow)
- [ ] Nested tags show correct arrow direction (parent → child)

## Release Process

1. Update version in `manifest.json`
2. Update `CHANGELOG.md`
3. Test thoroughly
4. Commit changes
5. Create git tag: `git tag -a 3.1.0 -m "Release v3.1.0"`
6. Push tag: `git push origin 3.1.0`
7. Create GitHub release

## Resources

- [Obsidian API Documentation](https://docs.obsidian.md/)
- [Obsidian Plugin Developer Docs](https://marcus.se.net/obsidian-plugin-docs/)
- [Obsidian Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin)

## Questions?

Open an issue or discussion on GitHub!

