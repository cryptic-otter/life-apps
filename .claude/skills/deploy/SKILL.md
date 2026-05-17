---
name: deploy
description: Type-check, commit, and push all changes to main in one step.
---

# Deploy

Type-check, commit, and push all changes to main in one step.

## Steps

1. **Type-check first**: run `npx tsc --noEmit`. If there are errors, report them and stop — do not commit broken code.

2. **Check what's changed**: run `git status` and `git diff` to understand the scope of changes.

3. **Stage and commit**: add the relevant files, write a concise commit message that focuses on *why* the change was made (not what — the diff shows that). Always include the co-author trailer:
   ```
   Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
   ```

4. **Push**: push to `main`. Do not ask for confirmation — the user has opted into auto-push for this project.

5. **Report**: confirm the push succeeded and note that Vercel will auto-deploy.

## Rules

- Never commit if `tsc --noEmit` has errors.
- Never use `--no-verify` or skip hooks.
- If there is nothing to commit (clean working tree), say so and stop.
- Stage specific files — avoid `git add .` if there are unrelated changes in the working tree.
