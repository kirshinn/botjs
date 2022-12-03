require('dotenv').config();
const TelegramApi = require('node-telegram-bot-api');
const {gameOptions, againOptions} = require('./options');
const sequilize = require('./db');

const bot = new TelegramApi(process.env.TELEGRAM_API_TOKEN, {polling: true});

bot.setMyCommands([
    {command: '/start', description: 'Начальное приветствие'},
    {command: '/info', description: 'Информация о пользователе'},
    {command: '/game', description: 'Игра в угадай цифру'},
]);

const chats = {};

const startGame = async chatId => {
    await bot.sendMessage(chatId, `Сейчас я загадаю цифру от 0 до 9, а ты должен ее угадать!`);
    chats[chatId] = Math.floor(Math.random() * 10);
    await bot.sendMessage(chatId, `Отгадывай`, gameOptions);
}

const start = async () => {

    try {
        await sequilize.authenticate();
        await sequilize.sync();
    } catch (e) {
        console.log('Не удалось установить подлкючение к базе данных!\n', e);
    }

    bot.on('message', async msg => {
        const text = msg.text;
        const chatId = msg.chat.id;

        if (text === '/start') {
            return bot.sendMessage(chatId, `Добро пожаловать в telegram бот Kirshin Bot!`);
        }

        if (text === '/info') {
            return bot.sendMessage(chatId, `Вы вошли как ${msg.from.username}`);
        }

        if (text === '/game') {
            return startGame(chatId);
        }

        return bot.sendMessage(chatId, 'Данной команды не существует');
    });

    bot.on('callback_query', msg => {
        const data = msg.data;
        const chatId = msg.message.chat.id;

        if (data === '/again') {
            return startGame(chatId);
        }

        if(data === chats[chatId]) {
            return bot.sendMessage(chatId, `Поздравляю, ты отгадал цифру: ${chats[chatId]}`, againOptions);
        } else {
            return bot.sendMessage(chatId, `К сожалению ты не отгадал, бот загадал цифру: ${chats[chatId]}`, againOptions);
        }
    });
}

start();