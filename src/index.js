const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const Config = require('../config/config.json');
const wait = require('util').promisify(setTimeout);
const fetch = require('node-fetch');
const fetch_options = {
    method: 'GET',
    headers: {
        'User-Agent': 'Joe-Biden-Bot/1.0.0 (by uwu277 on e621)'
    }
};

const { global_commands: Commands } = require('../config/commands.json');
//const { linux_space_commands: LinuxSpaceCommands } = require('../config/commands.json');

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands('941473684885999656'),
            { body: Commands },
        );
        await rest.put(
            Routes.applicationGuildCommands('941473684885999656', '715519373619626107'),
            { body: Commands }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

const { Client, Intents, MessageEmbed } = require('discord.js');
const client = new Client(
    {
        intents: [
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MESSAGES,
            Intents.FLAGS.GUILD_BANS
        ]
    }
);

async function log_channel(...attachments) {
    let channel_id = '929819635312902236';
    let channel = client.channels.cache.get(channel_id);
    channel = channel ? channel : client.channels.fetch(channel_id);
    if (channel) {
        try {
            return await channel.send({ embeds: attachments });
        } catch (err) {
            throw { error: err, msg: 'Error sending message. Check bot permission' };
        }
    } else {
        throw { error: null, msg: 'Could not find channel' };
    }
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'ping') {
        await interaction.reply('Pong!');
        // Moderation commands
    } else if (interaction.commandName === 'ban') {
        if (!interaction.member.permissions.has('BAN_MEMBERS')) {
            await interaction.reply('You need ban members permission to use this command!');
            return;
        }

        let member = interaction.options.getMember('member');
        let member_user = member.user;
        let reason = interaction.options.getString('reason');
        reason = reason ? reason : '<No reason provided>';
        if (!member) {
            await interaction.reply('You need to specify a member!');
            return;
        }

        if (!member.bannable) {
            await interaction.reply(`Cannot ban ${member}. Check bot permission`);
            return;
        }
        await member.ban({ reason: reason });
        await interaction.reply(`Successfully banned ${member}.`);

        let embed = new MessageEmbed()
            .setTitle('Member Banned')
            .addField('Member', `${member_user.tag} (${member_user.id})`, false)
            .addField('Reason', reason, false)
            .addField('Duration', '.', false)
            .addField('Moderator',
                `${interaction.user.tag} ${interaction.member.nickname ? `(aka ${interaction.member.nickname})` : ''} (${interaction.user.id})`,
                false
            )
            .setTimestamp(Date.now())
            .setColor(Config.colors.embed);
        log_channel(embed)
            .then(async msg => {
                await msg.pin();
            })
            .catch(async err => {
                await interaction.editReply(`Error whilst writing to log channel:\n${err.msg}`)
                if (err.error) console.error(err.error);
            });
    } else if (interaction.commandName === 'kick') {
        if (!interaction.member.permissions.has('KICK_MEMBERS')) {
            await interaction.reply('You need kick members permission to use this command!');
            return;
        }

        let member = interaction.options.getMember('member');
        let member_user = member.user;
        let reason = interaction.options.getString('reason');
        reason = reason ? reason : '<No reason provided>';
        if (!member) {
            await interaction.reply('You need to specify a member!');
            return;
        }

        if (!member.kickable) {
            await interaction.reply(`Cannot kick ${member}. Check bot permission`);
            return;
        }
        await member.kick({ reason: reason });
        await interaction.reply(`Successfully kicked ${member}.`);

        console.log("reason %s", reason)

        let embed = new MessageEmbed()
            .setTitle('Member Kicked')
            .addField('Member', `${member_user.tag} (${member_user.id})`, false)
            .addField('Reason', reason, false)
            .addField('Moderator',
                `${interaction.user.tag} ${interaction.member.nickname ? `(aka ${interaction.member.nickname})` : ''} (${interaction.user.id})`,
                false
            )
            .setTimestamp(Date.now())
            .setColor(Config.colors.embed);
        log_channel(embed)
            .then(async msg => {
                await msg.pin();
            })
            .catch(async err => {
                await interaction.editReply(`Error whilst writing to log channel:\n${err.msg}`)
                if (err.error) console.error(err.error);
            });
    } else if (interaction.commandName === 'clear') {
        if (!interaction.member.permissions.has('BAN_MEMBERS')) {
            await interaction.reply('You need manage messages permission to use this command!');
            return;
        }

        let amount = interaction.options.getInteger('messages');
        let channel = interaction.channel;
        try {
            await channel.bulkDelete(amount);
            await interaction.reply(`Successfully deleted ${amount} messages.`);
            await wait(1000);
            await interaction.deleteReply();
        } catch (err) {
            await interaction.reply(`There was an error deleting ${amount} messages. Check permission`);
            console.error(err);
        }
        // Joe Biden Commands
    } else if (interaction.commandName == 'e621') {
        if (!interaction.channel.nsfw) {
            await interaction.reply('This is not a NSFW channel!');
            return;
        }
        let tags = interaction.options.getString('tags');
        let blacklist = interaction.options.getString('blacklist');

        let url = "https://e621.net/posts.json?page=1";
        if (tags) {
            url += '&tags=' + encodeURIComponent(tags);
        }
        if (tags) {
            url += '&blacklist=cub+underage+' + encodeURIComponent(blacklist);
        }

        fetch(url, fetch_options)
            .then(res => res.json())
            .then(async json => {
                let posts = json["posts"];
                if (posts) {
                    let post = posts[Math.floor((Math.random() * posts.length))];
                    if (post)
                        await interaction.reply(post.file.url);
                    else
                        await interaction.reply('Could not find any posts with those tags! be sure that tag exists!');
                } else {
                    await interaction.reply('Could not find any posts with those tags! be sure that tag exists!');
                }
            });
    } else if (interaction.commandName == 'e926') {
        if (!interaction.channel.nsfw) {
            await interaction.reply('This is not a NSFW channel!');
            return;
        }
        let tags = interaction.options.getString('tags');
        let blacklist = interaction.options.getString('blacklist');

        let url = "https://e926.net/posts.json?page=1";
        if (tags) {
            url += '&tags=' + encodeURIComponent(tags);
        }
        if (tags) {
            url += '&blacklist=cub+underage+' + encodeURIComponent(blacklist);
        }

        fetch(url, fetch_options)
            .then(res => res.json())
            .then(async json => {
                let posts = json["posts"];
                if (posts) {
                    let post = posts[Math.floor((Math.random() * posts.length))];
                    if (post)
                        await interaction.reply(post.file.url);
                    else
                        await interaction.reply('Could not find any posts with those tags! be sure that tag exists!');
                } else {
                    await interaction.reply('Could not find any posts with those tags! be sure that tag exists!');
                }
            });
    }
})

client.login(process.env.TOKEN);
