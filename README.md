# shop-energo

Desktop-верстка интернет-магазина по макетам OpenPencil. Целевая ширина — 1440 px. Первый этап содержит инфраструктуру и минимальную HTML-заготовку; блоки дизайна ещё не реализованы.

## Запуск

Нужны Node.js 24 и npm. Все npm-зависимости используются только локальной сборкой; сайт не подключает CDN, удалённые шрифты или внешние runtime-библиотеки.

```bash
npm ci
npm run dev
```

Адрес: http://127.0.0.1:5173/. Изменения внутри `src/` автоматически пересобирают `dist/`; страницу нужно обновить в браузере.

```bash
npm run dev -- --host 127.0.0.1 --port 4173 --base /shop-energo/
npm run build
```

Первый вариант позволяет проверить сайт в поддиректории, как на GitHub Pages. Занятый порт завершает сервер с ошибкой, без автоматического переключения.

## Структура

```text
src/
  assets/
    fonts/
    icons/
    images/
  css/
    base/
    blocks/
    app.css
  js/
    modules/
    main.js
  index.html
scripts/
  build.mjs
  dev.mjs
.github/workflows/pages.yml
```

Обычный CSS разделён на reset, variables, typography, ui и файлы самостоятельных блоков. `src/css/app.css` собирает используемые стили через локальные `@import`. JavaScript-модули подключаются через `src/js/main.js`.

Production-сборка очищает только проектный `dist/`, объединяет и минимизирует CSS через PostCSS, postcss-import, autoprefixer и cssnano, а JS — через esbuild. HTML-файлы из корня `src/` и локальные assets копируются в `dist/`.

```text
dist/
  assets/
  css/app.min.css
  js/app.min.js
  index.html
  .nojekyll
```

Пути в HTML относительные. Из CSS изображения и шрифты подключаются через `../assets/…`, из HTML — через `assets/…`. Это сохраняет работу из `/shop-energo/` на GitHub Pages.

## GitHub Pages

Workflow `Deploy GitHub Pages` запускается при push в `main` и вручную. Он выполняет checkout, `npm ci`, `npm run build` и публикует только `dist/` через GitHub Actions. В настройках репозитория Pages → Source должен быть выбран GitHub Actions.

Репозиторий: https://github.com/asallweb/shop-energo. Адрес после успешного deployment: https://asallweb.github.io/shop-energo/.

Workflow использует официальную схему [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Дальнейшая верстка

Общие скриншоты находятся локально в `screenshot design/` и исключены из Git. Точные размеры, typography, цвета, изображения и состояния берутся из выбранных элементов OpenPencil через MCP. Работа идёт поблочно: изучение, реализация, сравнение при 1440 px, исправление, следующий блок.

Шрифты и графика будут добавлены из макета в `src/assets/`. Пока используется системный Arial для HTML-заготовки. Локальные `@font-face` будут объявлены после получения точного семейства и реально используемых начертаний. Mobile/tablet на этом этапе не реализуются.
