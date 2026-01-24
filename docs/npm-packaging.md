# npm Packaging Guide

This guide covers packaging the Daedalion CLI as an npm package and publishing it to npm or installing locally.

## Prerequisites

- Node.js >= 20
- npm account (for publishing to npm)
- Access to the `daedalion` package namespace (if publishing)

## Quick Start

### Package as tarball

```bash
npm pack
```

This creates `daedalion-x.y.z.tgz` in the current directory.

### Install from local tarball

```bash
npm pack
npm install -g ./daedalion-x.y.z.tgz
```

### Publish to npm

```bash
npm publish --dry-run  # Test without actual publishing
npm publish           # Publish to npm
```

## Package Contents

The package.json `files` field controls what gets included in the published package:

```json
{
  "files": [
    "src/",
    "bin/",
    "templates/",
    "docs/",
    "LICENSE"
  ]
}
```

**What gets packaged:**
- Source code (`src/`)
- CLI entry point (`bin/`)
- Template files (`templates/`)
- Documentation (`docs/`)
- License file

**What does NOT get packaged:**
- Test files (`test/`)
- Development scripts
- `.gitignore`
- Local config files

## Publishing Workflow

### 1. Prepare package.json

```bash
# Ensure fields are correct
cat package.json
```

Key fields:
- `name`: Package name
- `version`: Sem version (bump before publishing)
- `description`: Short package description
- `bin`: CLI entry point
- `files`: Files to include in package
- `engines`: Node.js version requirement

### 2. Dry-run publish

```bash
npm publish --dry-run
```

This validates the package structure without actually publishing.

### 3. Check npm registry

```bash
npm view daedalon
```

### 4. Publish

```bash
npm publish
```

## Version Management

### Semantic Versioning (SemVer)

```bash
# Patch version (1.0.1 → 1.0.2): Bug fixes
npm version patch

# Minor version (1.0.0 → 1.1.0): New features, backward compatible
npm version minor

# Major version (1.0.0 → 2.0.0): Breaking changes
npm version major
```

This updates `package.json` and creates a git tag.

### Force publish (skip pre-release checks)

```bash
npm publish --force
```

Used only when needed (e.g., after failed publish attempt).

## Local Development Installation

### Install as symlink (recommended)

```bash
npm link          # Link package globally
daedalion build   # Test CLI
npm unlink        # Unlink when done
```

This creates a symlink in your global node_modules that points to your working directory.

### Install from tarball

```bash
npm pack
npm install -g ./daedalion-x.y.z.tgz
```

## Publishing from CI/CD

### GitHub Actions Example

```yaml
name: Publish to npm

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### GitLab CI Example

```yaml
publish:
  stage: release
  only:
    - tags
  script:
    - npm ci
    - npm publish
  variables:
    NPM_TOKEN: $CI_JOB_TOKEN
```

## Verifying Published Package

### Check package info

```bash
npm view daedalion
```

### Check specific version

```bash
npm view daedalon@1.0.0
```

### List all versions

```bash
npm view daedalon versions --json
```

### Install specific version

```bash
npm install -g daedalion@1.0.0
```

## Troubleshooting

### "Cannot publish over existing version"

The version already exists in npm. Bump version first:

```bash
npm version patch  # or minor/major
npm publish
```

### "E404 Package not found"

You're not logged in or don't have permissions:

```bash
npm login
npm whoami  # Verify login
```

### "402 Payment Required"

You're trying to publish a scoped package without a paid private registry:

```bash
publishConfig:
  access: public
```

Or publish to public npmjs.org.

### Package size too large

Remove unnecessary files from `files` field in package.json.

Check package contents:

```bash
# Extract tarball to inspect
tar -tzf daedalion-x.y.z.tgz | head -20
```

### Wrong entry point

Verify `bin/daedalion.js` is executable and has shebang:

```bash
#!/usr/bin/env node
```

Make it executable:

```bash
chmod +x bin/daedalion.js
```

## Unpublishing (Emergency Only)

```bash
# Deprecate (keeps version but marks as deprecated)
npm deprecate daedalion@1.0.0 "Use latest version instead"

# Unpublish entire package (DANGEROUS, only within 72h)
npm unpublish --force
```

**Note:** You can only unpublish within 72 hours of publishing. After that, you must deprecate.

## Private Registry Publishing

Publish to private registry (e.g., GitHub Packages, GitLab, Verdaccio):

```bash
npm publish --registry https://npm.pkg.github.com/<org>
```

Configure registry in `.npmrc`:

```
registry=https://npm.pkg.github.com/<org>
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

## Security Best Practices

### Use npm 2FA

```bash
npm profile enable-2fa
npm profile enable-2fa auth-and-writes
```

### Use scoped packages

```json
{
  "name": "@your-org/daedalion"
}
```

### Scoped to registry

```json
{
  "publishConfig": {
    "access": "public"
  }
}
```

### Publish provenance (npm v9+)

```bash
npm publish --provenance
```

This adds cryptographic provenance to the package.

## Useful Commands

| Command | Purpose |
|---------|---------|
| `npm pack` | Create tarball |
| `npm publish --dry-run` | Test publish without pushing |
| `npm publish` | Publish to npm |
| `npm deprecate <pkg>` | Mark version as deprecated |
| `npm view <pkg>` | Show package metadata |
| `npm view <pkg> versions` | List all versions |
| `npm whoami` | Show current npm user |
| `npm login` | Authenticate with npm |
| `npm version <type>` | Bump version and tag |
| `tar -tzf file.tgz` | Inspect tarball contents |
| `npm audit` | Check for vulnerabilities |

## Checklist Before Publishing

- [ ] Version bumped (`npm version patch/minor/major`)
- [ ] `package.json` fields correct (name, version, description)
- [ ] Tests passing (`npm test`)
- [ ] Documentation updated
- [ ] CHANGELOG updated (if applicable)
- [ ] Dry-run successful (`npm publish --dry-run`)
- [ ] Verified package contents (`tar -tzf daedalion-x.y.z.tgz`)
- [ ] Logged in to npm (`npm whoami`)
- [ ] Two-factor auth enabled (recommended)