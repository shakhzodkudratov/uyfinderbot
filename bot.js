const TelegramBot = require('node-telegram-bot-api');
const { JsonDB, Config } = require('node-json-db');
const fs = require('fs')

try {
    fs.readFileSync('listings.json')
} catch {
    fs.writeFileSync('listings.json', JSON.stringify({ listed: [] }))
}

const db = new JsonDB(new Config("listings", true, false, '/'))

const configDefault = require('./config.default.json')
const configCustom = require('./config.json')
const config = Object.assign({}, configDefault, configCustom)

const bot = new TelegramBot(config.botToken, {polling: true})

async function update() {
    try {
        console.log('updating', new Date().toUTCString())
        const listed = await db.getData('/listed') ?? []

        for (const query of config.queries) {
            const response = await fetch(buildApiUrl(query))
            const results = (await response.json()).results

            for (const result of results) {
                if (listed.includes(result.id)) {
                    continue
                }
                
                await delay(config.delayBetweenMessages)

                const url = config.listingUrl + result.id
                await bot.sendMessage(config.sendTo, `New listing ${url}`)

                listed.push(result.id)
                await db.push('/listed', listed, true)
            }

            await delay(config.delayBetweenIterations)
        }

        console.log('update finished', new Date().toUTCString())
    } catch (e) {
        console.error(e)
        console.log('update failed', new Date().toUTCString())
    }

    setTimeout(() => update(), config.delayCooldown * 1000)
}

update()

function buildApiUrl(extraParams = {}) {
    const query = new URLSearchParams()

    for (const key in config.defaultQueryParams) {
        query.append(key, formatUrlParamValue(config.defaultQueryParams[key]))
    }

    for (const key in extraParams) {
        query.append(key, formatUrlParamValue(extraParams[key]))
    }

    return config.apiUrl + '?' + query.toString()
}

function delay(timesec = 1) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve()
        }, timesec * 1000)
    })
}

function formatUrlParamValue(value) {
    return value.replaceAll(' ', '+')
}