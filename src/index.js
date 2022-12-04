require('dotenv').config();
const TelegramApi = require('node-telegram-bot-api');
const sequilize = require('./db');
const User = require('./models');
const {gameOptions, againOptions} = require('./options');

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
        try {
            if (text === '/start') {
                const user = await User.findOne({ where: { chatId: chatId } });
                if (!user) await User.create({
                    userName: msg.from.username,
                    lastName: msg.from.last_name,
                    firstName: msg.from.first_name,
                    chatId: msg.chat.id,
                    languageCode: msg.from.language_code
                });
                return bot.sendMessage(chatId, `Добро пожаловать в telegram бот Kirshin Bot!`);
            }
            if (text === '/info') {
                const user = await User.findOne({ where: { chatId: chatId } });
                await bot.sendMessage(chatId, `Вы вошли как ${msg.from.username}`);
                return bot.sendMessage(chatId, `В игре у вас ${user.right} правильных ответов, ${user.wrong} неправильных ответов.`);
            }
            if (text === '/game') {
                return startGame(chatId);
            }
            return bot.sendMessage(chatId, 'Данной команды не существует');
        } catch (e) {
            return bot.sendMessage(chatId, 'Произошла какая то ошибка!');
        }
    });

    bot.on('callback_query', async msg => {
        const data = msg.data;
        const chatId = msg.message.chat.id;
        const user = await User.findOne({ where: { chatId: chatId } });
        if (data === '/again') {
            return startGame(chatId);
        }
        if (data == chats[chatId]) {
            user.right++;
            await bot.sendMessage(chatId, `Поздравляю, ты отгадал цифру: ${chats[chatId]}`, againOptions);
        } else {
            user.wrong++;
            await bot.sendMessage(chatId, `К сожалению ты не отгадал, бот загадал цифру: ${chats[chatId]}`, againOptions);
        }
        await user.save();
    });
}

start();