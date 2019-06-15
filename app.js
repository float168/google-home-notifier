'use strict';

const GoogleHomeNotifier = require('./google-home-notifier');
const MinSlack = require('./min_slack');
const Log4js = require('log4js');

require('dotenv').config({path: require('path').resolve(__dirname, '.env')});


//-----------------------------------------------------------------------------
// Config

// Repeater
const interval = 3; //[sec]
const timeout = 3 * 60 * 60; //[sec]

// Google Home
const device_name = process.env.GOOGLE_HOME_NAME;
GoogleHomeNotifier.device(device_name, 'ja');

// MinSlack
const slack_channel_id = process.env.SLACK_CHANNEL_ID;
const slack_token = process.env.SLACK_API_TOKEN;
const reaction = 'thumbsup';

// Logger
Log4js.configure({
    appenders : {
        system : {type : 'file', filename : '/var/log/slack_to_google_home/system.log'}
    },
    categories : {
        default : {appenders : ['system'], level : 'info'},
    }
});
const logger = Log4js.getLogger('system');


//-----------------------------------------------------------------------------
// Helper

const get_current_ts = () => {
    return Date.now() / 1000.0; //[sec]
}

// https://qiita.com/albno273/items/c2d48fdcbf3a9a3434db
const sleep = (second) => {
    return new Promise(resolve => setTimeout(resolve, second * 1000.0));
};

const repeat_until_true = async (timeout, interval, func) => {
    const start_ts = get_current_ts();
    const stop_ts = start_ts + timeout;
    let next_ts = start_ts;

    for (let count = 1; get_current_ts() < stop_ts; ++count) {
        const to_break = func();
        if (to_break) return;

        next_ts += interval;
        const diff_next = next_ts - get_current_ts();
        if (diff_next > 0) {
          await sleep(diff_next);
        }
    }
}



//-----------------------------------------------------------------------------
// Main

(async () => {
    const start_ts = get_current_ts();
    await repeat_until_true(timeout, interval, async () => {
        const message = await MinSlack.get_latest_message(
            slack_token, slack_channel_id, logger);
        if (message['ts'] < start_ts) return false;

        const text = MinSlack.extract_text(message);
        logger.info(`Text: ${text}`);

        await GoogleHomeNotifier.notify(text, logger.info);

        await Slack.add_reaction(slack_token, reaction, slack_channel_id, message['ts'], logger);

        return true;
    });
    logger.info('Task complete');
})();
