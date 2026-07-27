<div align="center">
  <img src=".github/assets/banner.svg" alt="Build Polished Websites — production-grade сайты без AI slop" width="100%">

  <h1>Build Polished Websites</h1>

  <p>
    Кросс-агентный skill для создания выразительных, поддерживаемых и
    проверенных production-сайтов без типичных AI-шаблонов.
  </p>

  <p><a href="README.md">English</a></p>
</div>

## Возможности

- единый skill для Claude Code, Codex и OpenCode;
- визуальная методология без AI slop;
- WordPress, WooCommerce, 1C‑Битрикс, Tilda, Shopify, Drupal, Webflow,
  headless CMS, static и legacy проекты;
- сохранение CMS editor workflow и источника истины;
- accessibility, security и техническое SEO;
- browser-проверка на реальных viewport;
- Lighthouse gate по медиане трёх запусков;
- безопасная установка с backup вместо перезаписи.

## Быстрый старт

```powershell
git clone https://github.com/denfry/build-polished-websites.git
cd build-polished-websites
.\install.ps1 -Agent all -Scope user
```

macOS, Linux, WSL или Git Bash:

```bash
git clone https://github.com/denfry/build-polished-websites.git
cd build-polished-websites
bash ./install.sh --agent all --scope user
```

После первой установки перезапустите агент, если skill не появился сразу.

## Использование

```text
Используй $build-polished-websites, чтобы переработать этот сайт,
сохранить архитектуру платформы и проверить browser, accessibility,
security, SEO и Lighthouse.
```

В Claude Code также доступна команда:

```text
/build-polished-websites
```

## Куда устанавливается

| Агент | Каталог |
|---|---|
| Claude Code | `~/.claude/skills/build-polished-websites` |
| Codex | `~/.agents/skills/build-polished-websites` |
| OpenCode | `~/.agents/skills/build-polished-websites` |

Для установки только одного агента укажите `claude`, `codex` или `opencode`
в параметре `-Agent` / `--agent`.

Установщик не перезаписывает существующий skill. Режим `-Replace` или
`--replace` сначала создаёт timestamp-backup.

## Quality gates

| Метрика | Минимум |
|---|---:|
| Performance | 90 |
| Accessibility | 95 |
| Best Practices | 95 |
| SEO | 95 |
| LCP | ≤ 2500 мс |
| CLS | ≤ 0.10 |
| TBT | ≤ 200 мс |

```bash
node build-polished-websites/scripts/lighthouse-gate.mjs \
  lighthouse-1.json lighthouse-2.json lighthouse-3.json
```

## Сравнение со скиллом и без него

В репозитории есть контролируемый
[A/B-пример одностраничного SaaS](benchmark/saas-single-html/): один нейтральный
промпт реализован как типичный AI-лендинг и как версия по методике скилла.
[Отчёт сравнения](benchmark/saas-single-html/comparison.md) содержит различия
в дизайне и медианные результаты трёх Lighthouse-прогонов.

| Без скилла | С `build-polished-websites` |
|---|---|
| [![Типичный фиолетовый SaaS-лендинг без скилла](benchmark/saas-single-html/screenshots/without-skill.png)](benchmark/saas-single-html/without-skill.html) | [![Продуктовый интерфейс журнала инцидентов со скиллом](benchmark/saas-single-html/screenshots/with-skill.png)](benchmark/saas-single-html/with-skill.html) |
| Шаблонная визуальная подача · Lighthouse gate **не пройден** | Собственная арт-дирекция · Lighthouse **100 / 100 / 100 / 100** |

Полная документация, архитектура и правила участия находятся в
[основном README](README.md).
