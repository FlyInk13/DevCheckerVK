// ==UserScript==
// @name         DevChecker
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Check Developers and testers in vk.com!
// @author       Flyink13
// @match        https://vk.com/*
// @grant        none
// ==/UserScript==

function DevUsers() {

    var cache = {}; // Кэш
    var titles = { // Подсказки к иконкам
        "devclub": "Разработчик из @devclub",
        "specialtesters": "Тестировщик из Special Forces",
        "testpool": "Тестировщик из /testpool"
    };

    function insertStyles() { // Фукция иниацилизации стилей
        var style = document.createElement("style"); // Создаем элемент стилей
        style.innerHTML =
            '.user_checker_icon{' + // css стили
            '   width: 12px; height: 12px; border-radius: 12px;' +
            '   display: inline-block;  margin: 0px 0px -1px 2px;' +
            '}' +
            '.devclub{background: black;}' +
            '.specialtesters{background: cyan;}' +
            '.testpool{background: blue;}';
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
            icon.className = "user_checker_icon " + type; // назначаем ей класс
            icon.target = "_blank"; // Открывать в новой вкладке
            icon.href = "https://vk.com/bugtracker?act=reporter&id=" + info.user_id; // Ссылка на карточку тестировщика
            icon.title = titles[type]; // Подсказка
            link.appendChild(icon); // Добавляем ссылку в ссылку
        });
        return info; // Отдаем результат для ссылок ждущих кеша
    }

    var executeCode = function () { // Функция передаваемая в execute для получение исформации о пользователе
        var types = []; // Типы
        var ui = API.utils.resolveScreenName(Args); // Получаем id пользователя
        if (ui.type != "user") return {
            types: [],
            user_id: 0
        }; // Если не юзер, то выходим
        // Далее проверяем на наличие юзера в группах, если есть, то складываем в типы
        var specialtesters = API.groups.isMember({
            group_id: 150825328,
            user_id: ui.object_id
        }); // specialtesters
        if (specialtesters) types.push("specialtesters");
        var testpool = API.groups.isMember({
            group_id: 134304772,
            user_id: ui.object_id
        }); // testpool
        if (testpool) types.push("testpool");
        var devclub = API.groups.isMember({
            group_id: 9713780,
            user_id: ui.object_id
        }); // dev
        if (devclub) types.push("devclub");
        // Выводим user_id и типы
        return {
            types: types,
            user_id: ui.object_id
        };
    };
    // Преобразуем функцию в строку, для дальнейшего считывания
    executeCode = executeCode.toString().replace(/.+?\{([^]+)\}$/, "$1");

    function checkUser(link) { // Проверка пользователя на группы
        var screen_name = link.href.replace(/.+\//, ""); // Убираем из ссылки vk.com и прочее
        if (cache[screen_name] && cache[screen_name].then) // Если в кэше Promise
            return cache[screen_name].then(drawIcons.bind(this, link)); // то ждем ее результат и выводим иконки
        if (cache[screen_name]) return drawIcons(link, cache[screen_name]); // Если в кэше результат, то выводим иконки
        cache[screen_name] = API("execute", { // Если нет в кэше, то проверяем ее
            screen_name: screen_name, // Передаем ссылку в execute
            code: executeCode // и код из функции выше
        }).then(function (r) { // Ждем результат
            cache[screen_name] = r.response; // Записываем результат в кэш
            localStorage.devUsersCache = JSON.stringify(cache); // Записываем кэш в localStorage
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

        if (localStorage.devUsersCache) // Есть ли сохраненный кэш
            cache = JSON.parse(localStorage.devUsersCache); // Загружаем и парсим

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
