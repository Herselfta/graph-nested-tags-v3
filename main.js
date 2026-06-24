/*
Graph Nested Tags Plugin v3.0 - Complete Rewrite
Based on actual Obsidian API testing
*/

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

var main_exports = {};
__export(main_exports, {
  default: () => GraphNestedTagsPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");

const DEFAULT_SETTINGS = {
  enableNestedTags: true,
  enableTagFileExpansion: true,
  // Depth semantics: layer 1 = files that have the tag; layer 2+ = expand further from those files
  tagFileExpansionDepth: 1,
  enableForGlobalGraph: true,
  enableForLocalGraph: true
};

const TAG_FILE_EXPANSION_DEPTH_MAX = 5;

// Settings Tab
class GraphNestedTagsSettings extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'Graph Nested Tags Settings' });

    new import_obsidian.Setting(containerEl)
      .setName('Enable for Global Graph')
      .setDesc('Enable plugin features in global graph view')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableForGlobalGraph)
        .onChange(async (value) => {
          this.plugin.settings.enableForGlobalGraph = value;
          await this.plugin.saveSettings();
          this.plugin.refreshAllGraphs();
        }));

    new import_obsidian.Setting(containerEl)
      .setName('Enable Nested Tags')
      .setDesc('Show hierarchical relationships between nested tags')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableNestedTags)
        .onChange(async (value) => {
          this.plugin.settings.enableNestedTags = value;
          await this.plugin.saveSettings();
          this.plugin.refreshAllGraphs();
        }));

    new import_obsidian.Setting(containerEl)
      .setName('Enable Tag File Expansion')
      .setDesc('Show all files with tags when tag nodes appear in graph')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableTagFileExpansion)
        .onChange(async (value) => {
          this.plugin.settings.enableTagFileExpansion = value;
          await this.plugin.saveSettings();
          this.plugin.refreshAllGraphs();
        }));

    new import_obsidian.Setting(containerEl)
      .setName('Tag File Expansion Depth')
      .setDesc('Layer 1 = files with this tag. Higher depth continues expanding from those files (like local graph expansion).')
      .addSlider(slider => slider
        .setLimits(1, TAG_FILE_EXPANSION_DEPTH_MAX, 1)
        .setValue(this.plugin.settings.tagFileExpansionDepth ?? 1)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.tagFileExpansionDepth = value;
          await this.plugin.saveSettings();
          this.plugin.refreshAllGraphs();
        }));

    new import_obsidian.Setting(containerEl)
      .setName('Enable for Local Graph')
      .setDesc('Enable plugin features in local graph view')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableForLocalGraph)
        .onChange(async (value) => {
          this.plugin.settings.enableForLocalGraph = value;
          await this.plugin.saveSettings();
          this.plugin.refreshAllGraphs();
        }));
  }
}

// Main Plugin
var GraphNestedTagsPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.injectedLeaves = new WeakSet();
    this.lastRefreshTime = new Map(); // Track last refresh time per leaf
    this.refreshCooldown = 1000; // 1 second cooldown between refreshes
  }

  async onload() {
    console.log('[Graph Nested Tags] Plugin loading...');
    await this.loadSettings();

    this.addSettingTab(new GraphNestedTagsSettings(this.app, this));

    // Commands
    this.addCommand({
      id: 'toggle-nested-tags',
      name: 'Toggle Nested Tags',
      callback: async () => {
        this.settings.enableNestedTags = !this.settings.enableNestedTags;
      await this.saveSettings();
        this.refreshAllGraphs();
        new import_obsidian.Notice(`Nested tags ${this.settings.enableNestedTags ? 'enabled' : 'disabled'}`);
      }
    });

    this.addCommand({
      id: 'toggle-tag-file-expansion',
      name: 'Toggle Tag File Expansion',
      callback: async () => {
        this.settings.enableTagFileExpansion = !this.settings.enableTagFileExpansion;
        await this.saveSettings();
        this.refreshAllGraphs();
        new import_obsidian.Notice(`Tag file expansion ${this.settings.enableTagFileExpansion ? 'enabled' : 'disabled'}`);
      }
    });

    // Event handlers
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        console.log('[Graph Nested Tags] layout-change event');
        this.injectAllGraphs();
        
        // Check if global graph was just opened and needs refresh
        const globalLeaves = this.app.workspace.getLeavesOfType("graph");
        if (globalLeaves.length > 0) {
          console.log('[Graph Nested Tags] Found global graphs after layout-change, refreshing...');
          setTimeout(() => {
            for (const leaf of globalLeaves) {
              this.refreshGraph(leaf);
            }
          }, 100);
        }
      })
    );

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", (leaf) => {
        console.log('[Graph Nested Tags] active-leaf-change event, type:', leaf?.view?.getViewType());
        if (leaf && (leaf.view.getViewType() === "graph" || leaf.view.getViewType() === "localgraph")) {
          setTimeout(() => {
            this.injectAllGraphs();
            // Refresh the newly activated graph
            console.log('[Graph Nested Tags] Refreshing newly activated graph...');
            this.refreshGraph(leaf);
          }, 50);
        }
      })
    );

    // Initial injection after workspace ready
    this.app.workspace.onLayoutReady(() => {
      console.log('[Graph Nested Tags] Workspace ready, starting initialization...');
      
      const attemptInject = (attemptNum) => {
        console.log(`[Graph Nested Tags] Attempt ${attemptNum}: injecting...`);
        this.injectAllGraphs();
        
        const globalLeaves = this.app.workspace.getLeavesOfType("graph");
        const localLeaves = this.app.workspace.getLeavesOfType("localgraph");
        console.log(`[Graph Nested Tags] Found ${globalLeaves.length} global, ${localLeaves.length} local graphs`);
        
        if (globalLeaves.length > 0) {
          console.log('[Graph Nested Tags] Refreshing global graphs...');
          for (const leaf of globalLeaves) {
            this.refreshGraph(leaf);
          }
        }
        
        if (localLeaves.length > 0) {
          console.log('[Graph Nested Tags] Refreshing local graphs...');
          for (const leaf of localLeaves) {
            this.refreshGraph(leaf);
          }
        }
      };
      
      // Try at multiple intervals
      setTimeout(() => attemptInject(1), 200);
      setTimeout(() => attemptInject(2), 500);
      setTimeout(() => attemptInject(3), 1000);
      setTimeout(() => attemptInject(4), 2000);
    });

    console.log('[Graph Nested Tags] Plugin loaded');
  }

  onunload() {
    console.log('[Graph Nested Tags] Plugin unloading...');
    const allLeaves = [
      ...this.app.workspace.getLeavesOfType("graph"),
      ...this.app.workspace.getLeavesOfType("localgraph")
    ];
    
    for (const leaf of allLeaves) {
      this.restoreGraphLeaf(leaf);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  // Inject into all graph views
  injectAllGraphs() {
    for (const leaf of this.app.workspace.getLeavesOfType("graph")) {
      this.injectGraphLeaf(leaf, "graph");
      this.injectGlobalGraphUI(leaf);
    }

    for (const leaf of this.app.workspace.getLeavesOfType("localgraph")) {
      this.injectGraphLeaf(leaf, "localgraph");
      this.injectLocalGraphUI(leaf);
    }
  }

  // Inject data processing into a graph view
  injectGraphLeaf(graphLeaf, graphType) {
    const leafRenderer = graphLeaf.view.renderer;
    
    if (this.injectedLeaves.has(leafRenderer)) {
      return;
    }

    if (!leafRenderer.originalSetData) {
      leafRenderer.originalSetData = leafRenderer.setData;
    }

    const plugin = this;
    
    leafRenderer.setData = function(data) {
      // Some graph implementations may call setData with partial/empty payloads during initialization.
      if (!data || !data.nodes || typeof data.nodes !== 'object') {
        return leafRenderer.originalSetData.call(this, data);
      }

      const isGlobal = graphType === "graph";
      const isLocal = graphType === "localgraph";

      // Preserve the full payload shape for compatibility with other plugins.
      // Only deep-copy nodes + per-node links to avoid mutating upstream objects.
      const modifiedData = {
        ...data,
        nodes: {}
      };

      for (const nodeId in data.nodes) {
        modifiedData.nodes[nodeId] = {
          ...data.nodes[nodeId],
          links: data.nodes[nodeId].links ? {...data.nodes[nodeId].links} : {}
        };
      }

      // Check if features are enabled
      const nestedEnabled = plugin.settings.enableNestedTags && 
        ((isGlobal && plugin.settings.enableForGlobalGraph) || 
         (isLocal && plugin.settings.enableForLocalGraph));
      
      const expansionEnabled = plugin.settings.enableTagFileExpansion && 
        ((isGlobal && plugin.settings.enableForGlobalGraph) || 
         (isLocal && plugin.settings.enableForLocalGraph));

      // Process data
      if (expansionEnabled) {
        plugin.expandTagFiles(modifiedData);
      }

      if (nestedEnabled) {
        plugin.processNestedTags(modifiedData);
      }

      return leafRenderer.originalSetData.call(this, modifiedData);
    };

    this.injectedLeaves.add(leafRenderer);
  }

  // Restore original setData
  restoreGraphLeaf(graphLeaf) {
    const leafRenderer = graphLeaf.view.renderer;
    if (leafRenderer.originalSetData) {
      leafRenderer.setData = leafRenderer.originalSetData;
      delete leafRenderer.originalSetData;
      this.injectedLeaves.delete(leafRenderer);
    }
  }

  // Process nested tag relationships
  processNestedTags(data) {
      const nodes = data.nodes;
    const tagNodes = [];

        for (const id in nodes) {
      if (nodes[id].type === "tag") {
        tagNodes.push(id);
      }
    }

    for (const tagId of tagNodes) {
      let childTag = tagId;
      
      for (let i = tagId.length - 1; i > 2; i--) {
        if (tagId[i] === "/") {
          const parentTag = tagId.slice(0, i);
          
          if (!(parentTag in nodes)) {
            nodes[parentTag] = { 
              type: "tag", 
              links: {}
            };
          }
          
          if (!nodes[parentTag].links) {
            nodes[parentTag].links = {};
          }
          if (!nodes[childTag].links) {
            nodes[childTag].links = {};
          }
          
          // Link: parent -> child
          if (!nodes[parentTag].links[childTag]) {
            nodes[parentTag].links[childTag] = true;
          }
          
          childTag = parentTag;
        }
      }
    }
  }

  // Expand tag nodes with files
  expandTagFiles(data) {
    const nodes = data.nodes;
    const tagNodes = [];

    for (const id in nodes) {
      if (nodes[id].type === "tag") {
        tagNodes.push(id);
      }
    }

    const depth = this.normalizeSpreadDepth(this.settings.tagFileExpansionDepth);
    const tagIndex = this.buildExactTagIndex();
    const seedFiles = new Set();

    for (const tagId of tagNodes) {
      const tagName = tagId.substring(1);
      const filesWithTag = tagIndex.get(tagName) ? Array.from(tagIndex.get(tagName)) : [];

      for (const filePath of filesWithTag) {
        // Add file node if not exists
        if (!(filePath in nodes)) {
          nodes[filePath] = {
            type: "file",
            links: {}
          };
        }
        
        if (!nodes[tagId].links) {
          nodes[tagId].links = {};
        }
        if (!nodes[filePath].links) {
          nodes[filePath].links = {};
        }
        
        // Bidirectional link
        if (!nodes[tagId].links[filePath]) {
          nodes[tagId].links[filePath] = true;
          nodes[filePath].links[tagId] = true;
        }

        seedFiles.add(filePath);
      }
    }

    // Continue expanding from the tag-linked files (layer 2+)
    if (depth > 1 && seedFiles.size > 0) {
      this.expandFromSeedNodes(nodes, seedFiles, depth - 1, tagIndex);
    }
  }

  normalizeSpreadDepth(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return 1;
    return Math.max(1, Math.min(TAG_FILE_EXPANSION_DEPTH_MAX, Math.floor(num)));
  }

  extractNormalizedTagsFromFileCache(cache) {
    const tags = [];

    // Frontmatter tags
    if (cache?.frontmatter) {
      const fmTags = cache.frontmatter.tags || cache.frontmatter.tag;
      if (fmTags) {
        const tagsArray = Array.isArray(fmTags) ? fmTags : [fmTags];
        for (const t of tagsArray) {
          if (t == null) continue;

          // YAML 里有人会写成 "a, b"，尽量宽容
          const raw = String(t);
          const parts = raw.includes(',') ? raw.split(',') : [raw];
          for (const part of parts) {
            const normalized = String(part).trim().replace(/^#/, '');
            if (normalized) tags.push(normalized);
          }
        }
      }
    }

    // Inline tags
    if (cache?.tags) {
      for (const tagCache of cache.tags) {
        const normalized = tagCache?.tag ? String(tagCache.tag).replace(/^#/, '') : '';
        if (normalized) tags.push(normalized);
      }
    }

    return tags;
  }

  buildExactTagIndex() {
    const index = new Map();
    const allFiles = this.app.vault.getMarkdownFiles();

    for (const file of allFiles) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (!cache) continue;

      const tags = this.extractNormalizedTagsFromFileCache(cache);
      if (!tags.length) continue;

      for (const tag of tags) {
        if (!index.has(tag)) {
          index.set(tag, new Set());
        }
        index.get(tag).add(file.path);
      }
    }

    return index;
  }

  getFileNeighbors(filePath) {
    const neighbors = new Set();

    // Outgoing links (resolved)
    const resolved = this.app.metadataCache?.resolvedLinks;
    const outgoing = resolved && resolved[filePath];
    if (outgoing && typeof outgoing === 'object') {
      for (const targetPath in outgoing) {
        if (!targetPath) continue;
        neighbors.add(targetPath);
      }
    }

    // Backlinks (if API available)
    try {
      const af = this.app.vault.getAbstractFileByPath(filePath);
      const backlinksFn = this.app.metadataCache?.getBacklinksForFile;
      if (af && typeof backlinksFn === 'function') {
        const backlinks = backlinksFn.call(this.app.metadataCache, af);
        const data = backlinks?.data;
        if (data && typeof data.forEach === 'function') {
          // data is usually a Map<sourcePath, count>
          data.forEach((_count, sourcePath) => {
            if (sourcePath) neighbors.add(sourcePath);
          });
        } else if (data && typeof data === 'object') {
          // Fallback for older shapes
          for (const sourcePath in data) {
            if (sourcePath) neighbors.add(sourcePath);
          }
        }
      }
    } catch (e) {
      // Ignore backlink failures; outgoing links are still useful
    }

    return neighbors;
  }

  inferNodeTypeFromPath(path) {
    try {
      const af = this.app.vault.getAbstractFileByPath(path);
      if (af && af instanceof import_obsidian.TFile) {
        if (af.extension && af.extension.toLowerCase() !== 'md') return 'attachment';
        return 'file';
      }
    } catch (e) {
      // ignore
    }
    return 'file';
  }

  getNodeNeighbors(nodeId, nodes, tagIndex) {
    const neighbors = new Set();

    // Always include existing graph edges first (keeps behavior close to built-in graph).
    const existingLinks = nodes?.[nodeId]?.links;
    if (existingLinks && typeof existingLinks === 'object') {
      for (const k in existingLinks) {
        if (k) neighbors.add(k);
      }
    }

    const nodeType = nodes?.[nodeId]?.type;

    // File / attachment: expand via forward/back links
    if (nodeType === 'file' || nodeType === 'attachment') {
      const fileNeighbors = this.getFileNeighbors(nodeId);
      for (const k of fileNeighbors) neighbors.add(k);
    }

    // File: also expand into tag nodes (full behavior)
    if (nodeType === 'file') {
      try {
        const af = this.app.vault.getAbstractFileByPath(nodeId);
        if (af && af instanceof import_obsidian.TFile) {
          const cache = this.app.metadataCache.getFileCache(af);
          const tags = this.extractNormalizedTagsFromFileCache(cache);
          for (const t of tags) {
            neighbors.add('#' + t);
          }
        }
      } catch (e) {
        // ignore
      }
    }

    // Tag: expand into files with that tag (full behavior)
    if (nodeType === 'tag' && typeof nodeId === 'string' && nodeId.startsWith('#')) {
      const tagName = nodeId.substring(1);
      const files = tagIndex?.get(tagName);
      if (files && typeof files.forEach === 'function') {
        files.forEach((p) => neighbors.add(p));
      }
    }

    return neighbors;
  }

  ensureNode(nodes, nodeId, preferredType) {
    if (nodeId in nodes) {
      if (!nodes[nodeId].links) nodes[nodeId].links = {};
      return;
    }

    let type = preferredType;
    if (!type) {
      if (typeof nodeId === 'string' && nodeId.startsWith('#')) type = 'tag';
      else type = this.inferNodeTypeFromPath(nodeId);
    }

    nodes[nodeId] = { type, links: {} };
  }

  linkNodes(nodes, a, b) {
    if (!nodes[a].links) nodes[a].links = {};
    if (!nodes[b].links) nodes[b].links = {};

    if (!nodes[a].links[b]) nodes[a].links[b] = true;
    if (!nodes[b].links[a]) nodes[b].links[a] = true;
  }

  expandFromSeedNodes(nodes, seedFiles, remainingLayers, tagIndex) {
    const MAX_NEW_NODES = 1500;
    let newNodesAdded = 0;

    // BFS from all seed files simultaneously
    const queue = [];
    const visited = new Set();

    for (const seed of seedFiles) {
      queue.push({ path: seed, depth: 0 });
      visited.add(seed);
    }

    while (queue.length > 0) {
      const { path: currentPath, depth } = queue.shift();
      if (depth >= remainingLayers) continue;

      // Ensure current node exists
      if (!(currentPath in nodes)) {
        this.ensureNode(nodes, currentPath, this.inferNodeTypeFromPath(currentPath));
        newNodesAdded++;
        if (newNodesAdded > MAX_NEW_NODES) break;
      } else {
        this.ensureNode(nodes, currentPath);
      }

      const neighbors = this.getNodeNeighbors(currentPath, nodes, tagIndex);
      for (const neighborId of neighbors) {
        if (!neighborId) continue;
        if (neighborId === currentPath) continue;

        if (!(neighborId in nodes)) {
          this.ensureNode(nodes, neighborId);
          newNodesAdded++;
          if (newNodesAdded > MAX_NEW_NODES) break;
        } else {
          this.ensureNode(nodes, neighborId);
        }

        this.linkNodes(nodes, currentPath, neighborId);

        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ path: neighborId, depth: depth + 1 });
        }
      }

      if (newNodesAdded > MAX_NEW_NODES) break;
    }
  }

  // Get files with exact tag match
  getFilesWithExactTag(tagName) {
    const files = [];
    const allFiles = this.app.vault.getMarkdownFiles();

    for (const file of allFiles) {
      const cache = this.app.metadataCache.getFileCache(file);
      if (!cache) continue;

      let hasExactTag = false;

      // Check frontmatter tags
      if (cache.frontmatter) {
        const fmTags = cache.frontmatter.tags || cache.frontmatter.tag;
        if (fmTags) {
          const tagsArray = Array.isArray(fmTags) ? fmTags : [fmTags];
          
          for (const tag of tagsArray) {
            const normalizedTag = String(tag).replace(/^#/, '');
            if (normalizedTag === tagName) {
              hasExactTag = true;
              break;
            }
          }
        }
      }

      // Check inline tags
      if (!hasExactTag && cache.tags) {
        for (const tagCache of cache.tags) {
          const normalizedTag = tagCache.tag.substring(1);
          if (normalizedTag === tagName) {
            hasExactTag = true;
            break;
          }
        }
      }

      if (hasExactTag) {
        files.push(file.path);
      }
    }

    return files;
  }

  // Inject UI controls into global graph
  injectGlobalGraphUI(graphLeaf) {
    setTimeout(() => {
      try {
        const containerEl = graphLeaf.view.containerEl;
        if (!containerEl) return;

        const graphControls = containerEl.querySelector('.graph-controls');
        if (!graphControls) return;

        // Find filters section
        let filtersSection = null;
        const sections = graphControls.querySelectorAll('.graph-control-section');
        
        for (const section of sections) {
          const text = section.textContent || '';
          if (text.includes('筛选') || text.includes('Filters')) {
            filtersSection = section;
            break;
          }
        }

        if (!filtersSection && sections.length > 0) {
          filtersSection = sections[0];
        }

        if (!filtersSection) return;

        // Check if already injected
        if (filtersSection.querySelector('.nested-tags-control')) {
          return;
        }

        // Search for Tags toggle in tree structure
        const treeChildren = filtersSection.querySelector('.tree-item-children');
        let tagsToggleGroup = null;
        let tagsCheckbox = null;
        
        if (treeChildren) {
          const settingItems = treeChildren.querySelectorAll('.setting-item.mod-toggle');
          
          for (const item of settingItems) {
            const nameEl = item.querySelector('.setting-item-name');
            const labelText = nameEl ? nameEl.textContent.trim() : '';
            
            if (labelText === '标签' || labelText === 'Tags') {
              tagsToggleGroup = item;
              tagsCheckbox = item.querySelector('.checkbox-container');
              break;
            }
          }
        }

        if (tagsToggleGroup && tagsCheckbox) {
          // Create as sub-items under Tags toggle
          this.createSubToggleControl(
            null,
            tagsToggleGroup,
            '嵌套标签',
            this.settings.enableNestedTags && this.settings.enableForGlobalGraph,
            async (enabled) => {
              this.settings.enableNestedTags = enabled;
              await this.saveSettings();
              this.updateAllGraphUIs();
            },
            tagsCheckbox,
            'global'
          );

          this.createSubToggleControl(
            null,
            tagsToggleGroup,
            '标签文件扩展',
            this.settings.enableTagFileExpansion && this.settings.enableForGlobalGraph,
            async (enabled) => {
              this.settings.enableTagFileExpansion = enabled;
              await this.saveSettings();
              this.updateAllGraphUIs();
            },
            tagsCheckbox,
            'global'
          );
        } else {
          // Fallback: create in graph-control-section-content
          let content = filtersSection.querySelector('.graph-control-section-content');
          if (!content) {
            content = filtersSection.createDiv('graph-control-section-content');
          }

          this.createStandaloneToggleControl(
            content,
            '嵌套标签',
            this.settings.enableNestedTags && this.settings.enableForGlobalGraph,
            async (enabled) => {
              this.settings.enableNestedTags = enabled;
              await this.saveSettings();
              this.updateAllGraphUIs();
            }
          );

          this.createStandaloneToggleControl(
            content,
            '标签文件扩展',
            this.settings.enableTagFileExpansion && this.settings.enableForGlobalGraph,
            async (enabled) => {
              this.settings.enableTagFileExpansion = enabled;
              await this.saveSettings();
              this.updateAllGraphUIs();
            }
          );
        }

      } catch (error) {
        console.error('[Graph Nested Tags] Error injecting global graph UI:', error);
      }
    }, 300);
  }

  // Inject UI controls into local graph
  injectLocalGraphUI(graphLeaf) {
    setTimeout(() => {
      try {
        const containerEl = graphLeaf.view.containerEl;
        if (!containerEl) return;

        const graphControls = containerEl.querySelector('.graph-controls');
        if (!graphControls) return;

        // Find filters section
        let filtersSection = null;
        const sections = graphControls.querySelectorAll('.graph-control-section');
        
        for (const section of sections) {
          const text = section.textContent || '';
          if (text.includes('筛选') || text.includes('Filters')) {
            filtersSection = section;
            break;
          }
        }

        if (!filtersSection && sections.length > 0) {
          filtersSection = sections[0];
        }

        if (!filtersSection) return;

        const hasInjectedToggles = !!filtersSection.querySelector('.nested-tags-control');

        let content = filtersSection.querySelector('.graph-control-section-content');
        if (!content) {
          content = filtersSection.createDiv('graph-control-section-content');
        }

        if (!hasInjectedToggles) {
          // Find the "Tags" toggle (it's a .setting-item.mod-toggle, not graph-control-group)
          let tagsToggleGroup = null;
          let tagsCheckbox = null;
          
          // Search in tree-item-children (tree structure)
          const treeChildren = filtersSection.querySelector('.tree-item-children');
          if (treeChildren) {
            const settingItems = treeChildren.querySelectorAll('.setting-item.mod-toggle');
            console.log('[Graph Nested Tags] Found', settingItems.length, 'setting items');
            
            for (const item of settingItems) {
              const nameEl = item.querySelector('.setting-item-name');
              const labelText = nameEl ? nameEl.textContent.trim() : '';
              console.log('[Graph Nested Tags] Setting item:', labelText);
              
              if (labelText === '标签' || labelText === 'Tags') {
                tagsToggleGroup = item;
                tagsCheckbox = item.querySelector('.checkbox-container');
                console.log('[Graph Nested Tags] Found Tags toggle!');
                break;
              }
            }
          }
          
          if (!tagsToggleGroup) {
            console.log('[Graph Nested Tags] Tags toggle not found in tree structure');
          }

          if (tagsToggleGroup && tagsCheckbox) {
            console.log('[Graph Nested Tags] Creating sub-toggles under Tags');
            // Create controls as sub-items after tags toggle
            this.createSubToggleControl(
              content,
              tagsToggleGroup,
              '嵌套标签',
              this.settings.enableNestedTags && this.settings.enableForLocalGraph,
              async (enabled) => {
                this.settings.enableNestedTags = enabled;
                await this.saveSettings();
                this.updateAllLocalGraphUIs();
              },
              tagsCheckbox,
              'local'
            );

            this.createSubToggleControl(
              content,
              tagsToggleGroup,
              '标签文件扩展',
              this.settings.enableTagFileExpansion && this.settings.enableForLocalGraph,
              async (enabled) => {
                this.settings.enableTagFileExpansion = enabled;
                await this.saveSettings();
                this.updateAllLocalGraphUIs();
              },
              tagsCheckbox,
              'local'
            );
          } else {
            console.log('[Graph Nested Tags] Tags toggle not found, creating standalone controls');
            // Fallback: create standalone controls
            this.createStandaloneToggleControl(
              content,
              '嵌套标签',
              this.settings.enableNestedTags && this.settings.enableForLocalGraph,
              async (enabled) => {
                this.settings.enableNestedTags = enabled;
                await this.saveSettings();
                this.updateAllLocalGraphUIs();
              }
            );

            this.createStandaloneToggleControl(
              content,
              '标签文件扩展',
              this.settings.enableTagFileExpansion && this.settings.enableForLocalGraph,
              async (enabled) => {
                this.settings.enableTagFileExpansion = enabled;
                await this.saveSettings();
                this.updateAllLocalGraphUIs();
              }
            );
          }
        }

        // Always try to inject the depth slider under the native Local Graph "Depth" control.
        this.injectLocalGraphExpansionDepthControl(graphLeaf);

      } catch (error) {
        console.error('[Graph Nested Tags] Error injecting UI:', error);
      }
    }, 300);
  }

  // Create a standalone toggle control (fallback if Tags toggle not found)
  createStandaloneToggleControl(container, label, initialValue, onChange) {
    const controlGroup = container.createDiv('graph-control-group nested-tags-control');
    controlGroup.style.display = 'flex';
    controlGroup.style.alignItems = 'center';
    controlGroup.style.justifyContent = 'space-between';
    
    const labelEl = controlGroup.createDiv('graph-control-label');
    labelEl.textContent = label;
    labelEl.style.cursor = 'pointer';
    labelEl.style.userSelect = 'none';
    
    const toggleContainer = controlGroup.createDiv('checkbox-container');
    if (initialValue) {
      toggleContainer.addClass('is-enabled');
    }
    
    let isEnabled = initialValue;
    const plugin = this;
    
    const toggle = async () => {
      isEnabled = !isEnabled;
      if (isEnabled) {
        toggleContainer.addClass('is-enabled');
      } else {
        toggleContainer.removeClass('is-enabled');
      }
      await onChange(isEnabled);
      
      const activeLeaf = plugin.app.workspace.activeLeaf;
      if (activeLeaf) {
        plugin.refreshGraph(activeLeaf, true);
      }
    };
    
    toggleContainer.addEventListener('click', toggle);
    labelEl.addEventListener('click', toggle);
    
    return controlGroup;
  }

  // Create a sub-toggle control (as child of tags toggle in tree structure)
  createSubToggleControl(container, parentToggle, label, initialValue, onChange, parentCheckbox, scope = 'local') {
    // Create as setting-item to match Obsidian's structure
    const settingItem = document.createElement('div');
    settingItem.className = 'setting-item mod-toggle nested-tags-control';
    settingItem.style.paddingLeft = '24px'; // Indent as sub-item
    
    // Insert after parent toggle
    parentToggle.parentNode.insertBefore(settingItem, parentToggle.nextSibling);
    
    // Create info section
    const infoDiv = settingItem.createDiv('setting-item-info');
    const nameDiv = infoDiv.createDiv('setting-item-name');
    nameDiv.textContent = label;
    nameDiv.style.fontSize = '13px'; // Smaller font for sub-items
    
    // Create control section
    const controlDiv = settingItem.createDiv('setting-item-control');
    const toggleContainer = controlDiv.createDiv('checkbox-container');
    
    // Smaller toggle for sub-items
    toggleContainer.style.transform = 'scale(0.75)';
    toggleContainer.style.transformOrigin = 'right center';
    
    const plugin = this;
    
    // Sync state from settings (not from internal variable)
    const syncState = () => {
      const isLocal = scope === 'local';
      const scopeEnabled = isLocal ? plugin.settings.enableForLocalGraph : plugin.settings.enableForGlobalGraph;
      const currentState = label === '嵌套标签'
        ? (plugin.settings.enableNestedTags && scopeEnabled)
        : (plugin.settings.enableTagFileExpansion && scopeEnabled);
      
      if (currentState) {
        toggleContainer.addClass('is-enabled');
      } else {
        toggleContainer.removeClass('is-enabled');
      }
      return currentState;
    };
    
    // Initial state
    syncState();
    
    // Function to update visibility based on parent tags toggle state
    const updateVisibility = () => {
      if (parentCheckbox && parentCheckbox.hasClass('is-enabled')) {
        settingItem.style.display = '';
      } else {
        settingItem.style.display = 'none';
      }
    };
    
    // Initial visibility
    updateVisibility();
    
    // Monitor parent checkbox changes
    if (parentCheckbox) {
      const observer = new MutationObserver(updateVisibility);
      observer.observe(parentCheckbox, { attributes: true, attributeFilter: ['class'] });
    }
    
    const toggle = async () => {
      // Sync state first to get current value from settings
      const currentState = syncState();
      const newState = !currentState;
      
      // Update UI immediately
      if (newState) {
        toggleContainer.addClass('is-enabled');
      } else {
        toggleContainer.removeClass('is-enabled');
      }
      
      // Save settings
      await onChange(newState);
      
      // Refresh graph
      const activeLeaf = plugin.app.workspace.activeLeaf;
      if (activeLeaf) {
        console.log('[Graph Nested Tags] Refreshing from UI toggle...');
        plugin.refreshGraph(activeLeaf, true);
      }
    };
    
    toggleContainer.addEventListener('click', toggle);
    nameDiv.addEventListener('click', toggle);
    
    // Store element for later updates
    settingItem.dataset.nestedTagsControl = label;
    
    return settingItem;
  }

  findLocalGraphDepthSetting(containerEl) {
    const candidates = containerEl.querySelectorAll('.setting-item');

    for (const item of candidates) {
      const nameEl = item.querySelector('.setting-item-name');
      const label = nameEl ? nameEl.textContent.trim() : '';
      if (!label) continue;

      const isDepthLabel = label === '深度' || label === 'Depth' || label.includes('深度') || label.includes('Depth');
      if (!isDepthLabel) continue;

      const rangeEl = item.querySelector('input[type="range"]');
      if (!rangeEl) continue;

      return item;
    }

    return null;
  }

  setSettingItemValueLabel(settingItemEl, value) {
    const str = String(value);
    const valueEl =
      settingItemEl.querySelector('.setting-item-control-value') ||
      settingItemEl.querySelector('.slider-value');

    if (valueEl) {
      valueEl.textContent = str;
      return;
    }

    // Some Obsidian builds don't show a dedicated value label; ignore.
  }

  injectLocalGraphExpansionDepthControl(graphLeaf) {
    setTimeout(() => {
      try {
        const containerEl = graphLeaf.view.containerEl;
        if (!containerEl) return;

        // Avoid duplicates
        if (containerEl.querySelector('.nested-tags-depth-control')) {
          return;
        }

        const depthSetting = this.findLocalGraphDepthSetting(containerEl);
        if (!depthSetting || !depthSetting.parentNode) return;

        const isChineseUI = (depthSetting.textContent || '').includes('深度');

        // Build a native-looking setting item via Obsidian Setting + SliderComponent.
        // This gives us the same hover/drag tooltip behavior as the built-in depth slider.
        const tempContainer = document.createElement('div');
        const setting = new import_obsidian.Setting(tempContainer)
          .setName(isChineseUI ? '标签扩散深度' : 'Tag expansion depth');

        let rangeEl = null;
        let pendingSaveTimer = null;

        setting.addSlider((slider) => {
          slider.setLimits(1, TAG_FILE_EXPANSION_DEPTH_MAX, 1);

          const initialDepth = this.normalizeSpreadDepth(this.settings.tagFileExpansionDepth);
          slider.setValue(initialDepth);

          // Match native "Depth" slider UX (hover/drag tooltip).
          if (typeof slider.setDynamicTooltip === 'function') {
            slider.setDynamicTooltip();
          }

          rangeEl = slider.inputEl;
          if (rangeEl) {
            const enabledForLocal = this.settings.enableTagFileExpansion && this.settings.enableForLocalGraph;
            rangeEl.disabled = !enabledForLocal;
          }

          slider.onChange((value) => {
            const v = this.normalizeSpreadDepth(value);
            this.settings.tagFileExpansionDepth = v;

            if (pendingSaveTimer) {
              clearTimeout(pendingSaveTimer);
              pendingSaveTimer = null;
            }

            // Debounce save + refresh to keep dragging smooth.
            pendingSaveTimer = setTimeout(async () => {
              try {
                await this.saveSettings();
                this.refreshGraph(graphLeaf, true);
                this.updateLocalGraphUI(graphLeaf);
              } catch (e) {
                console.error('[Graph Nested Tags] Failed saving expansion depth:', e);
              }
            }, 150);
          });
        });

        const controlEl = tempContainer.firstElementChild;
        if (!controlEl) return;

        controlEl.classList.add('nested-tags-depth-control');
        controlEl.dataset.nestedTagsDepthControl = 'tagFileExpansionDepth';

        // No description text in local graph UI (requested).
        const descEl = controlEl.querySelector('.setting-item-description');
        if (descEl) descEl.remove();

        // Match native depth slider layout: label on its own line, slider below.
        // (Native "Depth" uses a vertical layout in graph controls.)
        controlEl.style.flexDirection = 'column';
        controlEl.style.alignItems = 'stretch';
        controlEl.style.gap = '6px';
        const infoEl = controlEl.querySelector('.setting-item-info');
        if (infoEl) {
          infoEl.style.paddingRight = '0';
          infoEl.style.width = '100%';
        }
        const controlWrap = controlEl.querySelector('.setting-item-control');
        if (controlWrap) {
          controlWrap.style.width = '100%';
          controlWrap.style.justifyContent = 'stretch';
        }
        if (rangeEl) {
          rangeEl.style.width = '100%';
        }

        // Insert right below the native depth setting
        depthSetting.parentNode.insertBefore(controlEl, depthSetting.nextSibling);
      } catch (error) {
        console.error('[Graph Nested Tags] Error injecting local graph expansion depth control:', error);
      }
    }, 300);
  }

  // Refresh a single graph
  refreshGraph(graphLeaf, skipCooldown = false) {
    if (!graphLeaf || !graphLeaf.view) {
      return;
    }
    
    // Cooldown check to prevent infinite refresh loops (but skip for user-triggered refreshes)
    if (!skipCooldown) {
      const now = Date.now();
      const lastRefresh = this.lastRefreshTime.get(graphLeaf) || 0;
      if (now - lastRefresh < this.refreshCooldown) {
        console.log('[Graph Nested Tags] Refresh cooldown, skipping');
        return;
      }
      this.lastRefreshTime.set(graphLeaf, now);
    }
    
    const view = graphLeaf.view;
    const viewType = view.getViewType();
    
    console.log('[Graph Nested Tags] Refreshing', viewType, '...');
    
    if (viewType === 'graph') {
      // Global graph: use onunload + onload
      view.onunload();
      view.onload();
    } else if (viewType === 'localgraph') {
      // Local graph: use engine.render()
      if (view.engine && typeof view.engine.render === 'function') {
        view.engine.render();
      }
    }
    
    console.log('[Graph Nested Tags] Refreshed');
  }

  // Refresh all graphs
  refreshAllGraphs() {
    for (const leaf of this.app.workspace.getLeavesOfType("graph")) {
      this.refreshGraph(leaf);
    }
    
    for (const leaf of this.app.workspace.getLeavesOfType("localgraph")) {
      this.refreshGraph(leaf);
    }
    
    // Update all UIs
    this.updateAllGraphUIs();
  }

  // Update UI state for a single local graph
  updateLocalGraphUI(graphLeaf) {
    setTimeout(() => {
      const containerEl = graphLeaf.view.containerEl;
      if (!containerEl) return;

      const controls = containerEl.querySelectorAll('.nested-tags-control');
      
      controls.forEach(ctrl => {
        const toggleContainer = ctrl.querySelector('.checkbox-container');
        const labelText = ctrl.dataset.nestedTagsControl || ctrl.querySelector('.setting-item-name, .graph-control-label')?.textContent;
        
        if (toggleContainer && labelText) {
          let shouldBeEnabled = false;
          
          if (labelText.includes('嵌套标签')) {
            shouldBeEnabled = this.settings.enableNestedTags && this.settings.enableForLocalGraph;
          } else if (labelText.includes('标签文件扩展')) {
            shouldBeEnabled = this.settings.enableTagFileExpansion && this.settings.enableForLocalGraph;
          }
          
          if (shouldBeEnabled) {
            toggleContainer.addClass('is-enabled');
          } else {
            toggleContainer.removeClass('is-enabled');
          }
        }
      });

      // Sync expansion depth slider (local graph)
      const depthCtrl = containerEl.querySelector('.nested-tags-depth-control');
      if (depthCtrl) {
        const rangeEl = depthCtrl.querySelector('input[type="range"]');
        if (rangeEl) {
          const enabledForLocal = this.settings.enableTagFileExpansion && this.settings.enableForLocalGraph;
          rangeEl.disabled = !enabledForLocal;

          const v = this.normalizeSpreadDepth(this.settings.tagFileExpansionDepth);
          if (String(rangeEl.value) !== String(v)) {
            rangeEl.value = String(v);
          }
        }
      }
    }, 100);
  }

  // Update UI state for all local graphs
  updateAllLocalGraphUIs() {
    for (const leaf of this.app.workspace.getLeavesOfType("localgraph")) {
      this.updateLocalGraphUI(leaf);
    }
  }

  // Update UI state for a single global graph
  updateGlobalGraphUI(graphLeaf) {
    setTimeout(() => {
      const containerEl = graphLeaf.view.containerEl;
      if (!containerEl) return;

      const controls = containerEl.querySelectorAll('.nested-tags-control');
      
      controls.forEach(ctrl => {
        const toggleContainer = ctrl.querySelector('.checkbox-container');
        const labelText = ctrl.dataset.nestedTagsControl || ctrl.querySelector('.setting-item-name, .graph-control-label')?.textContent;
        
        if (toggleContainer && labelText) {
          let shouldBeEnabled = false;
          
          if (labelText.includes('嵌套标签')) {
            shouldBeEnabled = this.settings.enableNestedTags && this.settings.enableForGlobalGraph;
          } else if (labelText.includes('标签文件扩展')) {
            shouldBeEnabled = this.settings.enableTagFileExpansion && this.settings.enableForGlobalGraph;
          }
          
          if (shouldBeEnabled) {
            toggleContainer.addClass('is-enabled');
          } else {
            toggleContainer.removeClass('is-enabled');
          }
        }
      });
    }, 100);
  }

  // Update UI state for all graphs (both global and local)
  updateAllGraphUIs() {
    for (const leaf of this.app.workspace.getLeavesOfType("graph")) {
      this.updateGlobalGraphUI(leaf);
    }
    for (const leaf of this.app.workspace.getLeavesOfType("localgraph")) {
      this.updateLocalGraphUI(leaf);
    }
  }
};

/* nosourcemap */
