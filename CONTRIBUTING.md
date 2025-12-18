# Git Diff Flex - Contributing

## Commit Message Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automatic versioning.

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature (triggers minor version bump)
- `fix`: Bug fix (triggers patch version bump)
- `perf`: Performance improvement (triggers patch version bump)
- `docs`: Documentation changes (triggers patch version bump)
- `style`: Code style changes (triggers patch version bump)
- `refactor`: Code refactoring (triggers patch version bump)
- `test`: Test changes (triggers patch version bump)
- `build`: Build system changes (triggers patch version bump)
- `ci`: CI/CD changes (triggers patch version bump)
- `chore`: Other changes (triggers patch version bump)

### Breaking Changes
Add `BREAKING CHANGE:` in the commit footer to trigger a major version bump.

### Examples

```bash
# Patch release (1.0.0 -> 1.0.1)
git commit -m "fix: correct handle positioning on drag"

# Minor release (1.0.0 -> 1.1.0)
git commit -m "feat: add support for new GitHub diff layout"

# Major release (1.0.0 -> 2.0.0)
git commit -m "feat: redesign extension UI

BREAKING CHANGE: Complete UI overhaul requires users to reconfigure settings"
```

## Release Process

### Automatic Semantic Versioning
1. Go to **Actions** → **Semantic Release**
2. Click **Run workflow**
3. Leave **Override version** empty
4. Select **auto** for **Release type**
5. Click **Run workflow**

Semantic Release will:
- Analyze commit messages
- Determine version bump
- Update `manifest.json`
- Create changelog
- Create git tag and GitHub release
- Trigger build workflow

### Manual Version Override
1. Go to **Actions** → **Semantic Release**
2. Click **Run workflow**
3. Enter version in **Override version** (e.g., `1.2.3`)
4. Click **Run workflow**

### Manual Version Bump
1. Go to **Actions** → **Semantic Release**
2. Click **Run workflow**
3. Leave **Override version** empty
4. Select bump type: **patch**, **minor**, or **major**
5. Click **Run workflow**

## Build Workflow

The build workflow automatically runs when a release is published and:
- Packages extension files into a ZIP
- Uploads ZIP to the GitHub release
- Makes it available as a workflow artifact
- **Automatically uploads to Chrome Web Store** (if secrets are configured)
