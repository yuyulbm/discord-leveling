const { PermissionFlagsBits } = require("discord.js");
const serverSchema = require("../../models/serverData");
const xpModel = require("../../models/xp");

module.exports = {
  data: {
    name: "removelevel",
    description: "Remove levels from a user",
    default_member_permissions: PermissionFlagsBits.ManageChannels.toString(),
    options: [
      {
        name: "user",
        description: "The user to remove levels from",
        type: 6,
        required: true,
      },
      {
        name: "amount",
        description: "The amount of levels to remove",
        type: 4,
        required: true,
      },
    ],
    integration_types: [0],
  },
  run: async (client, interaction, args, username) => {
    const targetUser = interaction.options.get("user").member;
    const amount = interaction.options.getInteger("amount");

    if (!targetUser || isNaN(amount) || amount <= 0) {
      return interaction.reply({
        content:
          "Please provide a valid user and a positive integer amount of levels to remove.",
        ephemeral: true,
      });
    }

    try {
      const server = await serverSchema.findOne({
        guildID: interaction.guild.id,
      });
      if (!server || !server.levelingEnabled) {
        return interaction.reply({
          content: "Leveling system is not enabled for this server.",
          ephemeral: true,
        });
      }

      let userData = await xpModel.findOne({
        server: interaction.guild.id,
        user: targetUser.id,
      });

      if (!userData) {
        return interaction.reply({
          content: "The user doesn't have any leveling data.",
          ephemeral: true,
        });
      }

      userData.level -= amount;

      // Ensure level doesn't go below 0
      if (userData.level < 0) {
        userData.level = 0;
      }

      // Inform user
      await interaction.reply(
        `Successfully removed ${amount} level(s) from ${targetUser}.`
      );

      // Save the updated user data
      await userData.save();
    } catch (err) {
      console.error("Error removing levels:", err);
      return interaction.reply({
        content: "An error occurred while removing levels.",
        ephemeral: true,
      });
    }
  },
};
