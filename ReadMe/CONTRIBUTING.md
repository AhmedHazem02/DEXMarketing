# Contributing to DEX ERP

First off, thank you for considering contributing to DEX ERP! 🎉

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)

---

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

### Our Standards

**Examples of behavior that contributes to a positive environment:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Examples of unacceptable behavior:**
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

---

## Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js** >= 18.17.0
- **npm** >= 9.0.0 or **yarn** >= 1.22.0
- **Git** >= 2.30.0

### Setting Up Your Development Environment

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/dex-erp.git
   cd dex-erp
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/AhmedHazem02/dex-erp.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Verify setup**
   - Open http://localhost:3000
   - You should see the DEX ERP landing page

---

## How Can I Contribute?

### Reporting Bugs

**Before creating a bug report:**
- Check the [existing issues](https://github.com/AhmedHazem02/dex-erp/issues) to avoid duplicates
- Gather information about the bug (browser, OS, reproducible steps)

**How to submit a bug report:**

Use the bug report template and include:
- Clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Screenshots or videos if applicable
- Environment details (browser, OS, device)
- Console errors (if any)

### Suggesting Enhancements

**Before creating an enhancement suggestion:**
- Check if the feature already exists
- Check the [roadmap](CHANGELOG.md#unreleased) for planned features
- Search existing issues for similar suggestions

**How to submit an enhancement:**

Use the feature request template and include:
- Clear, descriptive title
- Detailed description of the proposed feature
- Rationale: Why is this feature needed?
- Examples or mockups if applicable
- Potential implementation approach

### Your First Code Contribution

Not sure where to start? Look for issues labeled:
- `good first issue` - simple issues perfect for beginners
- `help wanted` - issues where we need community help
- `documentation` - improvements to docs

---

## Development Workflow

### Branch Naming Convention

Use descriptive branch names:
```
feature/add-task-labels
bugfix/fix-login-redirect
hotfix/critical-security-patch
docs/update-deployment-guide
refactor/optimize-kanban-rendering
```

### Development Process

1. **Sync with upstream**
   ```bash
   git checkout main
   git pull upstream main
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Write clean, readable code
   - Follow the coding standards below
   - Add tests if applicable

4. **Test your changes**
   ```bash
   npm run type-check   # TypeScript validation
   npm run lint         # Code linting
   npm run test         # Unit tests
   npm run build        # Production build
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add task labels feature"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill in the PR template

---

## Coding Standards

### TypeScript

- Use **TypeScript** for all new code
- Define proper types (avoid `any`)
- Use interfaces for object shapes
- Leverage type inference when appropriate

**Example:**
```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  role: 'admin' | 'creator' | 'client';
}

function getUser(id: string): User {
  // implementation
}

// ❌ Bad
function getUser(id: any): any {
  // implementation
}
```

### React Components

- Use **functional components** with hooks
- Name components in PascalCase
- Use meaningful prop names
- Extract reusable logic into custom hooks

**Example:**
```tsx
// ✅ Good
interface TaskCardProps {
  task: Task;
  onDelete: (id: string) => void;
}

export function TaskCard({ task, onDelete }: TaskCardProps) {
  const { isLoading } = useTask(task.id);
  
  return (
    <Card>
      {/* component code */}
    </Card>
  );
}

// ❌ Bad
export default function Card1(props: any) {
  // implementation
}
```

### File Structure

- **Components** should be in `src/components/`
- **Pages** should be in `src/app/[locale]/`
- **Utilities** should be in `src/lib/`
- **Hooks** should be in `src/hooks/`
- **Types** should be in `src/types/`

### Styling

- Use **Tailwind CSS** utility classes
- Use **Shadcn/UI** components when available
- Avoid inline styles unless absolutely necessary
- Use CSS variables for theme colors

**Example:**
```tsx
// ✅ Good
<button className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md">
  Click me
</button>

// ❌ Bad
<button style={{ backgroundColor: '#FFD700', padding: '8px 16px' }}>
  Click me
</button>
```

### Code Organization

- Keep functions small and focused
- Extract magic numbers into constants
- Use descriptive variable names
- Add comments for complex logic

**Example:**
```typescript
// ✅ Good
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function isValidFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

// ❌ Bad
function check(f: File): boolean {
  return f.size <= 5242880; // What is this number?
}
```

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring without changing functionality
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, build config, etc.)

### Examples

```bash
# Feature
feat(tasks): add task label filtering

Add the ability to filter tasks by labels in the Kanban board.
This improves user productivity when managing large projects.

Closes #123

# Bug fix
fix(auth): prevent login redirect loop

Users were stuck in a redirect loop when session expired.
Fixed by properly handling session refresh.

Fixes #456

# Documentation
docs(readme): update installation instructions

Add Cloudinary setup steps to the getting started guide.
```

---

## Pull Request Process

### Before Submitting

**Checklist:**
- [ ] Code follows the project's coding standards
- [ ] All tests pass (`npm run test`)
- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] No linting errors (`npm run lint`)
- [ ] Production build succeeds (`npm run build`)
- [ ] Changes are documented (if needed)
- [ ] Screenshots/videos added (for UI changes)
- [ ] Updated CHANGELOG.md (for notable changes)

### PR Title Format

Use conventional commit format:
```
feat: add real-time status updates to Kanban board
fix: resolve task assignment notification bug
docs: improve deployment guide clarity
```

### PR Description Template

```markdown
## Description
Brief summary of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Related Issues
Closes #123
Related to #456

## Screenshots (if applicable)
[Attach screenshots or videos]

## Testing Done
- [ ] Tested on Chrome
- [ ] Tested on Firefox
- [ ] Tested on mobile
- [ ] Tested in Arabic (RTL)
- [ ] Tested with different user roles

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing tests pass locally
```

### Review Process

1. **Automated Checks**
   - CI/CD pipeline runs (tests, build, linting)
   - All checks must pass before review

2. **Code Review**
   - At least one maintainer must approve
   - Address all review comments
   - Push new commits to the same branch

3. **Merge**
   - Squash commits if needed
   - Delete branch after merge

### Addressing Review Feedback

```bash
# Make changes based on feedback
git add .
git commit -m "refactor: address review feedback"
git push origin feature/your-feature-name

# For force push (use carefully)
git commit --amend
git push --force-with-lease origin feature/your-feature-name
```

---

## Testing

### Writing Tests

**Unit Tests (Vitest):**
```typescript
import { describe, it, expect } from 'vitest';
import { isValidEmail } from '@/lib/utils';

describe('isValidEmail', () => {
  it('should return true for valid email', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  it('should return false for invalid email', () => {
    expect(isValidEmail('invalid-email')).toBe(false);
  });
});
```

**Component Tests (React Testing Library):**
```typescript
import { render, screen } from '@testing-library/react';
import { TaskCard } from '@/components/tasks/task-card';

describe('TaskCard', () => {
  it('renders task title', () => {
    const task = { id: '1', title: 'Test Task', status: 'new' };
    render(<TaskCard task={task} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
});
```

---

## Documentation

### Code Comments

- Use JSDoc for complex functions
- Explain **why**, not **what**
- Keep comments up-to-date

**Example:**
```typescript
/**
 * Calculates the treasury balance by summing all income and subtracting all expenses.
 * 
 * @param transactions - Array of all transactions
 * @returns Current balance
 * 
 * Note: This uses Decimal.js to prevent floating-point precision issues
 * with financial calculations.
 */
export function calculateBalance(transactions: Transaction[]): number {
  // implementation
}
```

### Updating Documentation

If your changes affect:
- **User-facing features** → Update README.md
- **Deployment process** → Update DEPLOYMENT.md
- **Testing procedures** → Update TESTING.md
- **API changes** → Update API documentation

---

## Need Help?

- 💬 **Discord**: [Join our community](https://discord.gg/dex-erp)
- 📧 **Email**: dev@dex-advertising.com
- 📝 **GitHub Discussions**: [Ask a question](https://github.com/AhmedHazem02/dex-erp/discussions)

---

## Recognition

Contributors will be:
- Listed in the project README
- Credited in release notes
- Invited to the contributors team

---

**Thank you for contributing to DEX ERP! 🚀**
