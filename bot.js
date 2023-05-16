const TelegramBot = require('node-telegram-bot-api');
const { JsonDB, Config } = require('node-json-db');

var db = new JsonDB(new Config("listings", true, false, '/'));

const apiUrl = 'https://api.uybor.uz/api/v1/listings?mode=search&limit=60&embed=category,subCategory,residentialComplex,media,region,city,district,zone,street,metro&order=upAt&operationType__eq=rent&priceCurrency__eq=usd&category__eq=7&room__in=1,2,3&price__lte=700&price__gte=400'

// replace the value below with the Telegram token you receive from @BotFather
const token = '6075120064:AAFLfjZmNCgbOUERR8oUSP3W9OjYhIQyr6k';

const group = -1001874078405

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

async function update() {
    console.log('updating', new Date().toUTCString())
    const response = await fetch(apiUrl)
    const results = (await response.json()).results
    
    const listed = await db.getData('/listed') ?? []

    results.forEach(result => {
        if (listed.includes(result.id)) {
            return
        }

        const url = 'https://uybor.uz/listings/' + result.id

        bot.sendMessage(group, `New listing ${url}`)
        listed.push(result.id)
    })

    console.log('update finished', new Date().toUTCString())
    await db.push('/listed', listed, true)
}

setInterval(() => update(), 5 * 60 * 1000)
update()

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // send a message to the chat acknowledging receipt of their message
//   bot.sendMessage(chatId, 'Received your message');
});