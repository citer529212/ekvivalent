# Источники и атрибуция

Учебный контент перенесён и адаптирован из файла «30.10.html» («Эквивалент»), предоставленного владельцем проекта. Сохранены исходные пометки о синтетических и стилизованных текстах. Данные ниже — сведения об источниках из предоставленного файла.

## Частотная лексика

- [FrequencyWords](https://github.com/hermitdave/FrequencyWords), H. Dave, частотность по OpenSubtitles 2018: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Переводы: словарь исходного приложения и [английский Викисловарь](https://en.wiktionary.org/), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
- Набор: `data/lexis.json`. Изменения: извлечение из исходного файла и переупаковка в JSON; интеграция в карточки и упражнения.

## Общий словарь EN ⇄ RU

- Англо-русская часть: английский Викисловарь, составитель [Matthias Buchmeier](https://en.wiktionary.org/wiki/User:Matthias_Buchmeier), CC BY-SA 3.0 / [GFDL](https://www.gnu.org/licenses/fdl-1.3.html). Данный проект использует предложенный вариант лицензирования CC BY-SA 3.0.
- Русско-английская часть и дополнения: [OpenRussian.org](https://openrussian.org/), CC BY-SA 4.0.
- Набор: `data/gendict.json`. Сведения об источниках сохранены в поле `src`. Изменения: извлечение и переупаковка для поиска в программе.

## Учебный словарь

- `data/words.json` сохранён из предоставленного файла с исходными переводами и примерами.

Адаптации перечисленных словарных наборов сохраняют указанные лицензии. Публичная доступность репозитория не означает предоставления единой лицензии на все прочие материалы программы.

## Аудирование: записи VOA Learning English

Автор и источник первых четырёх диалогов — Voice of America, VOA Learning English, курс Let’s Learn English. Использованы оригинальные MP3 диалогов и тексты реплик; вопросы и учебный интерфейс добавлены в «Эквиваленте». Файлы размещены в `media/listening/`.

- `voa-welcome.mp3`: [Lesson 1 — Welcome!](https://learningenglish.voanews.com/a/lets-learn-english-lesson-one/3111026.html)
- `voa-neighbours.mp3`: [Lesson 2 — Hello, I’m Anna!](https://learningenglish.voanews.com/a/lets-learn-english-lesson-2-hello/3113733.html)
- `voa-phone.mp3`: [Lesson 3 — I’m Here!](https://learningenglish.voanews.com/a/lets-learn-english-lesson-3-i-am-here/3126527.html)
- `voa-bag.mp3`: [Lesson 4 — What Is It?](https://learningenglish.voanews.com/a/lets-learn-english-lesson-4/3168920.html)

[Условия VOA](https://learningenglish.voanews.com/p/6021.html): материалы, созданные исключительно VOA, находятся в public domain; при использовании требуется атрибуция VOA. Сторонние материалы информагентств не входят в это разрешение; такие материалы для аудиобиблиотеки не использованы. Оригинальные ссылки на MP3 и источник сохранены в `listening-content.js`.

Остальные шесть сценариев и вопросы написаны для «Эквивалента». Учебные аудиозаписи подготовлены системными английскими голосами Samantha (US) и Daniel (UK); это не записи выступлений носителей. Пользовательские ответы и голос учащегося не отправляются на сервер; микрофон не используется.
