# Contributing to CSV Viewer with Image Preview

First off, thank you for considering contributing to this project! 🎉

The following is a set of guidelines for contributing to the CSV Viewer project. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## 🤝 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Standards

- **Be Respectful**: Treat everyone with respect and kindness
- **Be Collaborative**: Work together to achieve common goals
- **Be Inclusive**: Welcome newcomers and diverse perspectives
- **Be Professional**: Maintain professional communication

## 🚀 How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what you expected**
- **Include screenshots or GIFs if applicable**
- **Specify your environment** (OS, browser, Node.js version, etc.)

### 💡 Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **Include mockups or examples if applicable**

### 🔧 Code Contributions

1. **Fork the repository**
2. **Create a feature branch** from `main`
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

## 🛠️ Development Setup

### Prerequisites

- **Node.js** (v16 or higher)
- **Yarn** package manager
- **MongoDB** (local or cloud)
- **Git**

### Setup Steps

1. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/telegram_job_iraq.git
   cd telegram_job_iraq
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/bazhdarrzgar/telegram_job_iraq.git
   ```

3. **Install dependencies**
   ```bash
   yarn install
   ```

4. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your MongoDB connection string
   ```

5. **Start development server**
   ```bash
   yarn dev
   ```

## 📝 Coding Standards

### JavaScript/React

- Use **functional components** with hooks
- Follow **React best practices**
- Use **meaningful variable names**
- Add **PropTypes** or **TypeScript** for type checking
- Keep components **small and focused**

```javascript
// ✅ Good
const SearchInput = ({ value, onChange, placeholder }) => {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="search-input"
    />
  )
}

// ❌ Avoid
const Component = (props) => {
  // Large component with multiple responsibilities
}
```

### CSS/Styling

- Use **Tailwind CSS** utility classes
- Follow **mobile-first** responsive design
- Use **semantic class names** when custom CSS is needed
- Maintain **consistent spacing** using Tailwind's scale

```jsx
// ✅ Good
<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-md">
  <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
    Submit
  </button>
</div>

// ❌ Avoid
<div style={{display: 'flex', padding: '16px'}}>
  <button style={{backgroundColor: '#3B82F6'}}>Submit</button>
</div>
```

### File Organization

```
components/
├── ui/           # Base UI components
├── forms/        # Form-specific components
├── modals/       # Modal components
└── layout/       # Layout components

hooks/            # Custom React hooks
lib/              # Utility functions
types/            # TypeScript type definitions
```

## 📚 Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools

### Examples
```bash
feat(search): add fuzzy search functionality
fix(upload): resolve image upload error handling
docs(readme): update installation instructions
style(table): improve table cell spacing
refactor(api): simplify upload endpoint logic
```

## 🔄 Pull Request Process

1. **Update documentation** if necessary
2. **Add tests** for new functionality
3. **Ensure all tests pass**
4. **Update CHANGELOG.md** with your changes
5. **Follow the PR template**
6. **Request review** from maintainers

### PR Title Format
Use the same format as commit messages:
```
feat(search): add advanced filtering capabilities
```

### PR Description Template
```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] New and existing unit tests pass locally with my changes
```

## 🐛 Issue Reporting

### Bug Report Template
```markdown
## Bug Description
A clear and concise description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
A clear and concise description of what you expected to happen.

## Screenshots
If applicable, add screenshots to help explain your problem.

## Environment
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Version: [e.g. 22]
- Node.js version: [e.g. 18.0.0]

## Additional Context
Add any other context about the problem here.
```

### Feature Request Template
```markdown
## Feature Description
A clear and concise description of what you want to happen.

## Problem Statement
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

## Proposed Solution
A clear and concise description of what you want to happen.

## Alternatives Considered
A clear and concise description of any alternative solutions or features you've considered.

## Additional Context
Add any other context or screenshots about the feature request here.
```

## 🎯 Development Workflow

### Branch Naming Convention
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Example Workflow
```bash
# 1. Create and switch to feature branch
git checkout -b feature/advanced-search

# 2. Make your changes
# ... code changes ...

# 3. Commit with conventional format
git commit -m "feat(search): add advanced search filters"

# 4. Push to your fork
git push origin feature/advanced-search

# 5. Create pull request on GitHub
```

## 🧪 Testing Guidelines

### Unit Tests
- Write tests for new components
- Test edge cases and error conditions
- Aim for high test coverage

### Integration Tests
- Test component interactions
- Test API endpoints
- Test user workflows

### Manual Testing
- Test in multiple browsers
- Test responsive design
- Test accessibility features

## 📞 Getting Help

If you need help or have questions:

1. **Check the documentation** in the `/docs` folder
2. **Search existing issues** on GitHub
3. **Create a new issue** with the "question" label
4. **Join our discussions** in GitHub Discussions

## 🙏 Recognition

Contributors will be recognized in:
- The project README
- Release notes
- Contributors section

Thank you for contributing to make this project better! 🚀