# GitHub Pages

Подготовлено для аккаунта `present-site-1234812`. Имя нового публичного репозитория по умолчанию — `krestavr`. Репозиторий создан: https://github.com/present-site-1234812/krestavr. Сайт доступен: https://present-site-1234812.github.io/krestavr/. Первая публикация и совпадение HTML были проверены в браузере.

Из обычного терминала с рабочей авторизацией `gh`:

```sh
bash /mnt/sdb2/sitenikita/monolit/scripts/publish-github-pages.sh
```

Скрипт проверит аккаунт и сайт, создаст локальный коммит при наличии изменений, создаст публичный репозиторий, настроит `origin`, загрузит `main`, включит Pages с источником GitHub Actions и запустит публикацию. После успешного workflow скачает публичный HTML и сравнит его с локальным файлом. Только после этого выведет сообщение об успешной публикации.

Требуются `gh`, `git`, `python3`, `node` и `curl`. У авторизации должны быть права на создание репозитория, загрузку workflow и управление Pages. Скрипт не меняет видимость существующего приватного репозитория, не перезаписывает другой `origin`, не использует force push и не удаляет репозитории.

Повторный запуск использует тот же репозиторий. Непустой существующий репозиторий без совпадающего локального `origin` автоматически не подключается. Если первый push запустит workflow раньше включения Pages, он может завершиться ошибкой; после настройки скрипт запускает отдельную публикацию и проверяет её результат.

## Последующие обновления

```sh
cd /mnt/sdb2/sitenikita/monolit
python3 scripts/sync-inline.py
python3 scripts/verify-site.py
git add dist scripts
git commit -m "Update website"
git push
```

Каждый push в `main` запускает `.github/workflows/pages.yml`. В Pages загружается только `dist`, исходники и отчёты остаются в репозитории. `.openai` и локальные настройки не публикуются. Корень страницы — `dist/index.html`; пути сайта не зависят от имени репозитория.

При бесплатном GitHub Pages исходный репозиторий обычно должен быть публичным. Наличие Pages не подтверждает юридическую готовность коммерческого сайта: см. LEGAL-AUDIT.md.

Основа: [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [gh repo create](https://cli.github.com/manual/gh_repo_create), [Pages REST API](https://docs.github.com/en/rest/pages/pages).
