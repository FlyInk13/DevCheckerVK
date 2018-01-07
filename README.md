# DevCheckerVK
Check Developers and testers in vk.com!

# Пример изменения настроек
```js

localStorage.devUserGroups = devUserGroups = JSON.stringify({ // Настройки
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
    },
    "131851952":{
        title: "Пользователь Callback API Бота",
        href: "https://vk.com/gim131851952?sel=*",
        background: "url(https://flyink.ru/logos/cbbot.jpg) center/cover" // Пример указания изображения в качестве иконки
    }
});

delete localStorage.devUsersCache2; // Чистим кэш

```
