// ==UserScript==
// @name         DevChecker
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Check Developers and testers in vk.com!
// @author       Flyink13
// @match        https://vk.com/*
// @grant        none
// ==/UserScript==

function DevUsers() {

    var cache = {}; // Кэш
    var groups = { // Настройки
        "9713780": { // id групп
            title: "Разработчик из @devclub", // Подсказки
            href: "https://vk.com/bugtracker?act=reporter&id=*", // Ссылки * - id юзера
            background: "black", // иконка
        },
        "150825328": {
            title: "Тестировщик из Special Forces",
            href: "https://vk.com/bugtracker?act=reporter&id=*",
            background: "cyan"
        },
        "134304772": {
            title: "Тестировщик из /testpool",
            href: "https://vk.com/bugtracker?act=reporter&id=*",
            background: "blue"
        }
    };

    function insertStyles() { // Фукция иниацилизации стилей
        var style = document.createElement("style"); // Создаем элемент стилей
        style.innerHTML =
            '.user_checker_icon {' + // css стили
            '   width: 12px; height: 12px; border-radius: 12px;' +
            '   display: inline-block;  margin: 0px 0px -1px 2px; position: relative;' +
            '}';
        document.head.appendChild(style); // Добавляем в залоговок
    }

    function checkLinks(el) { // Функция поиска в элементе ссылок
        var links = el.querySelectorAll('.im-mess-stack--lnk, .author, .friends_field a');
        if (!links) return; // Если в элементе нет ссылок, то пропускаем
        Array.from(links).map(function (link) { // Если есть, то перебираем
            if (link.checked) return; // Если ссылка проверена, то пропускаем
            checkUser(link); // Если есть, то отдаем на проверку
            link.checked = 1; // Отмечаем прочитанной
        });
    }

    function drawIcons(link, info) { // Функция отрисовки иконок
        if (!info.types.length || !info.user_id) return; // Если у юзера его нет или если это не юзер, то выходим
        info.types.map(function (type) { // Перебираем группы
            var icon = document.createElement("a"); // Создаем ссылку
            icon.className = "user_checker_icon"; // назначаем ей класс
            icon.target = "_blank"; // Открывать в новой вкладке
            icon.href = groups[type].href.replace("*", info.user_id); // Ссылка на карточку тестировщика
            icon.title = groups[type].title; // Подсказка
            icon.style.background = groups[type].background; // Иконка
            icon.onmouseover = function () {
                showTooltip(icon, {force: 1, text: icon.title, black: 1});
            };
            link.appendChild(icon); // Добавляем ссылку в ссылку
        });
        return info; // Отдаем результат для ссылок ждущих кеша
    }

    var executeCode = function () { // Функция передаваемая в execute для получение исформации о пользователе
        var types = []; // Типы
        var groups = Args.groups.split(","); // id групп
        var ui = API.utils.resolveScreenName(Args); // Получаем id пользователя
        if (ui.type != "user") return {
            types: [],
            user_id: 0
        }; // Если не юзер, то выходим
        // Далее проверяем на наличие юзера в группах, если есть, то складываем в типы
        var group = 0; // Доя записи текущей группы;
        var isMember = 0; // Переменная для проверки подписки
        while(groups.length){ // Перебираем группы
            group = groups.shift(); // Первую в списке
            isMember = API.groups.isMember({ // Проверяем подписку
                group_id: group,
                user_id: ui.object_id
            });
            if (isMember) types.push(group); // Если подписан, то записываем это
        }
        // Выводим user_id и подписки
        return {
            types: types,
            user_id: ui.object_id
        };
    };

    // Преобразуем функцию в строку, для дальнейшего считывания execute
    executeCode = executeCode.toString().replace(/.+?\{([^]+)\}$/, "$1");

    function checkUser(link) { // Проверка пользователя на группы
        var screen_name = link.href.replace(/.+\//, ""); // Убираем из ссылки vk.com и прочее
        if (cache[screen_name] && cache[screen_name].then) // Если в кэше Promise
            return cache[screen_name].then(drawIcons.bind(this, link)); // то ждем ее результат и выводим иконки
        // Если в кэше результат и он не старее суток, то выводим иконки
        if (cache[screen_name] && cache[screen_name].updated > Date.now()) return drawIcons(link, cache[screen_name]);
        cache[screen_name] = API("execute", { // Если нет в кэше, то проверяем ее
            screen_name: screen_name, // Передаем ссылку в execute
            groups: groups.ids, // id групп
            code: executeCode // и код из функции выше
        }).then(function (r) { // Ждем результат
            cache[screen_name] = r.response; // Записываем результат в кэш
            cache[screen_name].updated = Date.now() + 864e5; // Записываем время через которое нужно повторить запрос
            if (r.response.types.length || !r.response.user_id) // Если юзер есть в группах или это не юзер,
                localStorage.devUsersCache2 = JSON.stringify(cache); // то записываем кэш в localStorage
            drawIcons(link, r.response); // Рисуем иконки
            return r.response; // Отдаем остальным
        }).catch(function (e) { // При ошибках
            console.error(e); // Выводим в консоль
        });
    }

    // Создаем обработчик мутаций элемента
    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) { // Перебираем обновленя в элементах
            if (mutation.target.nodeType !== 1) return; // Если элемент не блок, то выходим
            checkLinks(mutation.target); // Отдаем элемент на проверку ссылок
        });
    });

    window.addEventListener("load", function () { // Вешаем обработчик на загрузку страницы
        insertStyles(); // Вставляем стили

        if (localStorage.devUserGroups) // Есть ли сохраненный кэш
            groups = JSON.parse(localStorage.devUserGroups); // Загружаем и парсим
        if (localStorage.devUsersCache2) // Есть ли сохраненный кэш
            cache = JSON.parse(localStorage.devUsersCache2); // Загружаем и парсим

        groups.ids = Object.keys(groups).join(","); // id групп для передачи в execute

        loadScript("//ifx.su/~va", { // Загружаем библиотеку для работы с API через /dev/
            onLoad: function () { // Ждем загрузки
                checkLinks(document.body); // Отправляем body на проверку ссылок

                observer.observe(document.body, { // Запускаем обработчик мутаций
                    childList: true, // Проведять детей элемента
                    subtree: true // по всему дереву
                });
            }
        });
    });

}

var script = document.createElement('script'); // Создаем скрипт
script.appendChild(document.createTextNode('(' + DevUsers + ')();')); // Свставляем туда код функции
(document.body || document.head || document.documentElement).appendChild(script); // Добавляем в body или head
