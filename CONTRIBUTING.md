# Contributing to Graph Nested Tags

Thank you for considering contributing to this project! 🎉

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- **Description**: Clear description of the bug
- **Steps to Reproduce**: Detailed steps to reproduce the behavior
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Environment**: 
  - Obsidian version
  - Plugin version
  - Operating system
- **Console Logs**: Any relevant console output (Ctrl+Shift+I → Console)

### Suggesting Enhancements

Enhancement suggestions are welcome! Please include:
- **Use Case**: Why this feature would be useful
- **Proposed Solution**: How you envision it working
- **Alternatives**: Other approaches you've considered

### Pull Requests

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Test** your changes thoroughly
4. **Commit** your changes (`git commit -m 'Add some amazing feature'`)
5. **Push** to the branch (`git push origin feature/amazing-feature`)
6. **Open** a Pull Request

#### PR Guidelines

- Follow the existing code style
- Add comments for complex logic
- Update README.md if adding new features
- Update CHANGELOG.md
- Test in both global and local graph views
- Test multi-window scenarios if applicable

## Development Setup

This plugin is currently distributed as a compiled bundle (`main.js`). 

### Testing Changes

1. Make changes to `main.js`
2. Copy to your vault's `.obsidian/plugins/graph-nested-tags/`
3. Reload Obsidian (Ctrl/Cmd+P → "Reload app")
4. Test in console (Ctrl+Shift+I)

### Debugging

Enable detailed console logging:
```javascript
// The plugin already includes detailed logs
// Open console (Ctrl+Shift+I) to view all [Graph Nested Tags] messages
```

## Code Style

- Use clear, descriptive variable names
- Add comments for non-obvious logic
- Keep functions focused and small
- Follow existing patterns in the codebase

## Questions?

Feel free to open an issue for questions or discussions!

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

