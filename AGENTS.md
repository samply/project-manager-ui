# project-manager-ui (frontend)

Instructions for AI coding assistants working in this repository (`CLAUDE.md` imports this file).

## Operations: read `project-manager-ops` first

What spans repositories lives in the private GitLab repository `project-manager-ops` (GitLab group `teiler`; clone it
next to this repository, as `../project-manager-ops`): inventory of projects, servers and images
(`inventory.yaml`), runbooks (`runbooks/`), shared plans (`plans/`), decisions (`decisions.md`) and the backlog.
New plans go to its `plans/`.

- Before creating a release or hotfix branch, changing the version, tagging, or merging into `main`/`develop`: read
  `../project-manager-ops/CLAUDE.md`, `runbooks/release.md` and `decisions.md`, follow the runbook step by step and
  say which step you are on.
- If `../project-manager-ops` is missing or you cannot read it: stop and ask the developer. Do not improvise release
  or hotfix steps.
- `main` (production) and `develop` (test) change only through pull requests; never push to them directly. Create
  branches from a remote branch only with `--no-track` (`git switch --no-track -c <branch> origin/develop`) and push
  new branches with `git push -u origin <branch>`.
