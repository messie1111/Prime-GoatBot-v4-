import { Client, Collection } from 'discord.js';
import { Logger } from '@utils/logger';
import { CommandHandler } from '@modules/commands/handler';
import { EventHandler } from '@modules/events/handler';
import { DatabaseService } from '@db/database.service';
import { CacheService } from '@utils/cache';
import { TaskScheduler } from '@utils/scheduler';

export class Bot {
  private logger = new Logger('Bot');
  public commands = new Collection();
  public events = new Collection();
  private db: DatabaseService;
  private cache: CacheService;
  private scheduler: TaskScheduler;

  constructor(public client: Client) {
    this.db = new DatabaseService();
    this.cache = new CacheService();
    this.scheduler = new TaskScheduler();
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('🚀 Starting bot initialization...');

      // 1. Connect to database
      await this.db.connect();
      this.logger.success('✅ Database connected');

      // 2. Connect to cache
      await this.cache.connect();
      this.logger.success('✅ Cache connected');

      // 3. Load commands
      const commandHandler = new CommandHandler(this.client);
      const commands = await commandHandler.load();
      commands.forEach((cmd) => this.commands.set(cmd.data.name, cmd));
      this.logger.info(`📦 Loaded ${commands.length} commands`);

      // 4. Load events
      const eventHandler = new EventHandler(this.client);
      await eventHandler.load();
      this.logger.info(`📦 Loaded all events`);

      // 5. Sync commands with Discord
      await this.syncCommands();

      // 6. Start scheduled tasks
      await this.scheduler.start();
      this.logger.success('⏰ Task scheduler started');

      this.logger.success('🎉 Bot fully initialized!');
    } catch (error) {
      this.logger.error('Initialization failed:', error);
      process.exit(1);
    }
  }

  private async syncCommands(): Promise<void> {
    try {
      const commands = this.commands.map((cmd) => cmd.data.toJSON());
      await this.client.application?.commands.set(commands);
      this.logger.success(`🔄 Synced ${commands.length} slash commands`);
    } catch (error) {
      this.logger.error('Failed to sync commands:', error);
    }
  }

  async shutdown(): Promise<void> {
    this.logger.warn('Shutting down bot...');
    await this.scheduler.stop();
    await this.cache.disconnect();
    await this.db.disconnect();
    this.client.destroy();
  }
        }
