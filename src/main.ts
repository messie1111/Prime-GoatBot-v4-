import 'reflect-metadata';
import { config } from 'dotenv';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { Logger } from '@utils/logger';
import { Bot } from './bot';

config();

const logger = new Logger('Main');

// Validate environment variables
const requiredEnvVars = ['DISCORD_TOKEN'];
const missingEnvVars = requiredEnvVars.filter((env) => !process.env[env]);

if (missingEnvVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Create Discord client with all intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.AutoModerationExecution,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember,
  ],
  allowedMentions: { parse: ['users', 'roles'] },
});

const bot = new Bot(client);

// Ready event
client.once('ready', async () => {
  logger.success(`✅ Bot connected as ${client.user?.username}`);
  await bot.initialize();
});

// Error handling
client.on('error', (error) => {
  logger.error('Discord Client Error:', error);
});

client.on('warn', (message) => {
  logger.warn('Discord Client Warning:', message);
});

// Process error handling
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.warn('⚠️ Received SIGINT, shutting down...');
  await bot.shutdown();
  process.exit(0);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);
