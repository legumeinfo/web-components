---
name: Release Checklist
about: A checklist of tasks required to make a release
title: Release MAJOR.MINOR.PATCH
labels: release
assignees: ''

---

- [ ] Create a branch for the release.
- [ ] Update the dependencies. The dependabot PR backlog is not comprehensive and doesn't include transitive dependencies, and merging them one at a time tends to break things, so the best way to do this is manually with `npm`.
- [ ] Bump the `"version"` number in `package.json` and reinstall the dependencies so the correct version number is in `package-lock.json`.
- [ ] Do a test build of the NPM package on your local machine so you know if something is going off the rails before the automated build action on GitHub.
```console
npm run build
npm pack
npm publish --dry-run
```
- [ ] Open a PR that merges the release branch into main.
- [ ] Merge the release PR after it passes testing and review.
- [ ] Tag a corresponding release on GitHub. This will trigger an automated NPM package build on GitHub. If the package build succeeds it will be automatically published to NPM.
