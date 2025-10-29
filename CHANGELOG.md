# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

**Note**: This is an enhanced fork of the [original Graph Nested Tags plugin](https://github.com/drPilman/obsidian-graph-nested-tags) by drPilman. Versions 3.x+ represent significant enhancements and rewrites by Herta Herselfta.

---

## [3.1.0] - 2025-10-29

### Added
- UI controls now appear as sub-items under the native "Tags" toggle in the Filters section
- Smaller toggle buttons for sub-items (0.75x scale) for better visual hierarchy
- Sub-items automatically hide when parent "Tags" toggle is disabled
- UI controls in both global and local graph views
- Multi-window state synchronization

### Fixed
- Multi-window UI state sync issue (clicking toggle twice to change state)
- UI now properly follows the visual hierarchy
- Toggle buttons now have appropriate sizing for sub-items

### Changed
- Improved UI styling to match Obsidian's native design
- Better integration with Obsidian's tree-based control structure

## [3.0.0] - 2025-10-29

### Added
- Complete rewrite based on actual Obsidian API testing
- Different refresh methods for global vs local graphs
- Debouncing mechanism to prevent infinite refresh loops
- Detailed console logging for debugging

### Fixed
- Global graph not working on first open
- Local graph UI toggle not refreshing immediately
- Tag file expansion now works in both global and local graphs
- Refresh mechanism now uses verified methods (onunload/onload for global, engine.render() for local)

### Changed
- Simplified code from 650+ lines to more maintainable structure
- Removed all ineffective API calls (dataEngine.requestRebuild, etc.)
- Changed from guesswork to tested implementation

## [2.0.0] - 2025-10-29

### Added
- Support for local graph view
- Tag file expansion feature
- Plugin settings panel
- Command palette commands
- Settings synchronization between UI, commands, and settings panel

### Fixed
- NaN link count issues
- Tag matching boundary problems (now uses exact matching)
- Data deep copy to avoid pollution

### Changed
- Enhanced debugging logs
- Bilingual UI labels (Chinese and English)

## [1.0.4] - Original Version

### Features
- Basic nested tag hierarchy display
- Global graph support
- Automatic parent tag creation

---

## Legend

- `Added` - New features
- `Changed` - Changes in existing functionality
- `Deprecated` - Soon-to-be removed features
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Security fixes

