#!/usr/bin/env bash
# Run from the user's normal terminal: creates a PUBLIC repository and publishes dist/.
set -euo pipefail

project_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
repository_name="${1:-krestavr}"
expected_owner="present-site-1234812"

if [[ ! "$repository_name" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]]; then
  echo 'Недопустимое имя репозитория.' >&2
  exit 1
fi
for program in gh git python3 node curl; do
  command -v "$program" >/dev/null || { echo "Не найдена команда: $program" >&2; exit 1; }
done
cd -- "$project_root"
temporary_dir="$(mktemp -d)"
trap 'rm -rf -- "$temporary_dir"' EXIT

echo 'Проверка подключения к GitHub…'
gh api user > "$temporary_dir/user.json"
account_login="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["login"])' "$temporary_dir/user.json")"
account_id="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["id"])' "$temporary_dir/user.json")"
if [[ "$account_login" != "$expected_owner" ]]; then
  echo "Ожидался аккаунт $expected_owner, авторизован $account_login. Репозиторий не создан." >&2
  exit 1
fi
target_repository="$account_login/$repository_name"
target_remote="https://github.com/$target_repository.git"

if [[ "$(git branch --show-current)" != main ]]; then
  echo 'Запустите публикацию из ветки main. Ветки не переключались.' >&2
  exit 1
fi
existing_remote="$(git remote get-url origin 2>/dev/null || true)"
if [[ -n "$existing_remote" && "$existing_remote" != "$target_remote" && "$existing_remote" != "git@github.com:$target_repository.git" ]]; then
  echo 'origin уже указывает на другой репозиторий. Публикация остановлена.' >&2
  exit 1
fi

python3 scripts/sync-inline.py
python3 scripts/verify-site.py
node --check dist/loader.js
node --check dist/script.js
node --check dist/construction.js
node --check dist/text-build.js

git add -- .gitignore .github dist scripts README.md DESIGN-AUDIT.md LEGAL-AUDIT.md NAME-CHECK.md PUBLISHING.md
if ! git diff --cached --quiet; then
  author_name="$(git config user.name || true)"
  author_email="$(git config user.email || true)"
  git -c "user.name=${author_name:-$account_login}" \
      -c "user.email=${author_email:-$account_id+$account_login@users.noreply.github.com}" \
      commit -m 'Prepare Krestavr website and GitHub Pages deployment'
fi
source_commit="$(git rev-parse HEAD)"

if gh api "repos/$target_repository" > "$temporary_dir/repository.json" 2> "$temporary_dir/repository-error"; then
  visibility="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["visibility"])' "$temporary_dir/repository.json")"
  repository_size="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["size"])' "$temporary_dir/repository.json")"
  if [[ "$visibility" != public ]]; then
    echo 'Репозиторий уже существует и не является публичным. Его видимость не изменялась.' >&2
    exit 1
  fi
  if [[ -z "$existing_remote" && "$repository_size" != 0 ]]; then
    echo 'По этому имени уже существует непустой репозиторий. Его содержимое не изменялось.' >&2
    exit 1
  fi
else
  if ! grep -q 'HTTP 404' "$temporary_dir/repository-error"; then
    cat "$temporary_dir/repository-error" >&2
    exit 1
  fi
  echo "Создание публичного репозитория $target_repository…"
  gh repo create "$target_repository" --public \
    --description 'КРЕСТАВР — адаптивный строительный сайт с интерактивной фоновой анимацией'
fi
if [[ -z "$existing_remote" ]]; then git remote add origin "$target_remote"; fi
gh auth setup-git --hostname github.com
git push --set-upstream origin main

# Pages needs repository administration permissions. The initial push may start
# a run before Pages is enabled; explicitly dispatch a fresh run after setup.
if gh api "repos/$target_repository/pages" > "$temporary_dir/pages.json" 2> "$temporary_dir/pages-error"; then
  build_type="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("build_type", ""))' "$temporary_dir/pages.json")"
  if [[ "$build_type" != workflow ]]; then
    gh api --method PUT "repos/$target_repository/pages" -f build_type=workflow > /dev/null
  fi
else
  if ! grep -q 'HTTP 404' "$temporary_dir/pages-error"; then
    cat "$temporary_dir/pages-error" >&2
    exit 1
  fi
  gh api --method POST "repos/$target_repository/pages" -f build_type=workflow > /dev/null
fi

echo 'Запуск публикации GitHub Pages…'
# GitHub can take a few seconds to register a workflow on a newly created branch.
workflow_ready=false
for ((attempt=0; attempt<20; attempt++)); do
  if gh workflow view pages.yml --repo "$target_repository" > /dev/null 2>&1; then
    workflow_ready=true
    break
  fi
  sleep 2
done
if [[ "$workflow_ready" != true ]]; then
  echo "Workflow пока недоступен: https://github.com/$target_repository/actions" >&2
  exit 1
fi
gh workflow run pages.yml --repo "$target_repository" --ref main
run_id=''
for ((attempt=0; attempt<20; attempt++)); do
  run_id="$(gh run list --repo "$target_repository" --workflow pages.yml \
    --event workflow_dispatch --commit "$source_commit" --limit 1 \
    --json databaseId --jq '.[0].databaseId // empty')"
  if [[ -n "$run_id" ]]; then break; fi
  sleep 2
done
if [[ -z "$run_id" ]]; then
  echo "Не удалось получить запуск: https://github.com/$target_repository/actions" >&2
  exit 1
fi
gh run watch "$run_id" --repo "$target_repository" --interval 5 --exit-status

site_url="$(gh api "repos/$target_repository/pages" --jq .html_url)"
echo 'Проверка опубликованной страницы…'
curl --fail --location --silent --show-error --compressed \
  --retry 6 --retry-delay 5 --retry-all-errors \
  "${site_url}?revision=$source_commit" --output "$temporary_dir/published.html"
if ! cmp -s dist/index.html "$temporary_dir/published.html"; then
  echo "Страница отвечает, но её содержимое пока не совпадает с коммитом $source_commit." >&2
  echo "Проверьте запуск: https://github.com/$target_repository/actions/runs/$run_id" >&2
  exit 1
fi
gh repo edit "$target_repository" --homepage "$site_url"
echo "Репозиторий: https://github.com/$target_repository"
echo "Сайт опубликован и проверен: $site_url"
