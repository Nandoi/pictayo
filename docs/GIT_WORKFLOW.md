# PicTayo — Git workflow

## Branches

- `main`: stable reviewed code
- `feature/<scope>`: new behavior, e.g. `feature/camera-preview`
- `fix/<scope>`: bug fixes
- `refactor/<scope>`: restructure without changing behavior
- `chore/<scope>`: tooling and maintenance
- `docs/<scope>`: documentation only

## Start a new task

```bash
git status
git checkout main
git pull --ff-only origin main
git checkout -b feature/camera-preview
```

Use a different branch name for each task. `--ff-only` prevents unexpected merge commits while updating `main`.

## Check and commit

```bash
git status
git diff
npm run lint
npm run build
git add -A
git diff --cached --check
git diff --cached --stat
git commit -m "feat: add camera preview"
git push -u origin feature/camera-preview
```

A **commit** records a snapshot locally; a **push** uploads it; a **pull request** proposes merging it into the stable branch.

## Review and merge

Open a pull request targeting `main`. Describe the goal, important code changes, tests, and limitations. Address review findings with additional commits on the same feature branch. Merge only after checks and review are satisfactory.

```bash
git checkout main
git pull --ff-only origin main
git branch -d feature/camera-preview
```

Deleting the local feature branch after merging does not delete the GitHub repository or `main`.

## Rules

- Do not do feature work directly on `main`.
- Don't commit `.env` files, secrets, `node_modules`, `dist`, or personal captured photos.
- Review the staged diff before committing.
- Don't use force push as a default way to fix conflicts.
- Update `TRACKER.md` and `docs/LEARNING_LOG.md` when completing a milestone.
