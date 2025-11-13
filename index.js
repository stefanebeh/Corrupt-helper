// 1️⃣ Importuri
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} = require('discord.js');

// === Server Keep-Alive ===
const keepAlive = require('./keep_alive');
keepAlive(); // pornește serverul de uptime

// === Client Discord ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 2️⃣ Token și rol admin
const TOKEN = process.env.DISCORD_BOT_TOKEN;
const ADMIN_ROLE_ID = '1433970414706622504';

// 3️⃣ Counter pentru tichete
let ticketCount = 1;

// 4️⃣ Ready event
client.once('ready', () => {
  console.log(`✅ Bot online ca ${client.user.tag}`);
});

// 5️⃣ Comanda pentru ticket panel
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.content.toLowerCase() === '!ticket panel set') {
    const embed = new EmbedBuilder()
      .setTitle('<a:emoji_23:1437165438315532431> SUPPORT TICKET SYSTEM')
      .setDescription(
        `<a:emoji_21:1437163698161717468> Need Help? Click the button below to create a support ticket.\n\n` +
        `<a:emoji_21:1437163698161717468> Our staff team will assist you as soon as possible.\n\n` +
        `<a:emoji_21:1437163698161717468> Please describe your issue clearly in the ticket.\n\n` +
        `<a:emoji_21:1437163698161717468> Available 24/7 for your convenience!`
      )
      .setColor('#89CFF0')
      .setThumbnail('https://cdn.discordapp.com/emojis/1437165310775132160.gif')
      .setImage('https://i.imgur.com/rCQ33gA.gif');

    const button = new ButtonBuilder()
      .setCustomId('create_ticket')
      .setLabel('Create Ticket')
      .setEmoji('🎟️')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(button);

    await message.channel.send({ embeds: [embed], components: [row] });
  }
});

// 6️⃣ Interacțiuni (ticket create / close)
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  // ✅ Creare ticket
  if (interaction.customId === 'create_ticket') {
    await interaction.deferReply({ ephemeral: true });

    try {
      const channelName = `ticket-${String(ticketCount).padStart(3, '0')}`;
      ticketCount++;

      const ticketChannel = await interaction.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: interaction.guild.roles.everyone, deny: [PermissionsBitField.Flags.ViewChannel] },
          { id: interaction.user.id, allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ] },
          { id: ADMIN_ROLE_ID, allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ] }
        ]
      });

      const ticketEmbed = new EmbedBuilder()
        .setTitle('<a:emoji_23:1437165438315532431> TICKET CREATED')
        .setDescription(
          `<a:emoji_21:1437163698161717468> <@${interaction.user.id}> created this ticket!\n\n` +
          `<a:emoji_21:1437163698161717468> Please describe your issue in detail so staff can assist you.\n\n` +
          `<a:emoji_21:1437163698161717468> Staff will respond shortly.`
        )
        .setColor('#89CFF0')
        .setThumbnail('https://cdn.discordapp.com/emojis/1437165310775132160.gif')
        .setImage('https://i.imgur.com/rCQ33gA.gif')
        .setTimestamp();

      const closeButton = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(closeButton);

      await ticketChannel.send({ embeds: [ticketEmbed], components: [row] });

      // trimite DM
      await interaction.user.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('<a:emoji_23:1437165438315532431> TICKET CREATED')
            .setDescription(
              `<a:emoji_21:1437163698161717468> Your support ticket has been created successfully.\n\n` +
              `<a:emoji_21:1437163698161717468> Please check the server to describe your issue.`
            )
            .setColor('#89CFF0')
            .setThumbnail('https://cdn.discordapp.com/emojis/1437165310775132160.gif')
            .setImage('https://i.imgur.com/rCQ33gA.gif')
        ]
      }).catch(() => {}); // ignoră dacă DM-urile sunt blocate

      await interaction.editReply({
        content: `✅ Your ticket has been created! Go to ${ticketChannel} to describe your issue.`,
        ephemeral: true
      });

    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: '❌ There was an error creating your ticket.', ephemeral: true });
    }
  }

  // 🔒 Închidere ticket
  if (interaction.customId === 'close_ticket') {
    await interaction.reply({ content: '🔒 Closing ticket...', ephemeral: true });
    setTimeout(async () => {
      await interaction.channel.delete().catch(() => {});
    }, 2000);
  }
});

// 7️⃣ Login
client.login(TOKEN);
