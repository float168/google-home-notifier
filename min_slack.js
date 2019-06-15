const Slack = require('slack');

// @param[in] token Slack Webhook token
// @param[in] channel_id Slack channel ID (not name)
// @param[in] logger Logger instance
const get_latest_message = (token, channel_id, logger = console) => {
    return Slack.channels.history({
        token: token,
        channel: channel_id,
        count: 1
    }).then((data) => {
        return data['messages'][0];
    }).catch((err) => {
        logger.error(`Fail getting message from slack: ${err.message}`);
        throw 'Slack error';
    });
};
exports.get_latest_message = get_latest_message;

// @param[in] token Slack Webhook token
// @param[in] reaction_name Reaction name to add
// @param[in] channel_id Slack channel ID (not name)
// @param[in] message_ts Message timestamp
// @param[in] logger Logger instance
const add_reaction = (token, reaction_name, channel_id, message_ts, logger = console) => {
    Slack.reactions.add({
        token: token,
        name: reaction_name,
        channel: channel_id,
        timestamp: message_ts
    }).then(() => {
        logger.info(`Add reaction ${reaction_name} to ${message_ts}`);
    }).catch(logger.error);
};
exports.add_reaction = add_reaction;

// @param[in] message Slack message object
const extract_text = (message) => {
    let text = message['text'];
    if (message['attachments']) {
        text = text || message['attachments'][0]['text'];
    }
    return text;
};
exports.extract_text = extract_text;

