#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { ConfigManager } from '../config/ConfigManager';
import { spawn, ChildProcess } from 'child_process';

/**
 * Minecraft Bot CLI ツール
 * ボットの設定管理、起動、監視を行うコマンドラインインターフェース
 */
export class BotCLI {
  private program: Command;
  private configManager: ConfigManager;
  private runningProcess: ChildProcess | null = null;

  constructor() {
    this.program = new Command();
    this.configManager = new ConfigManager();
    this.setupCommands();
  }

  /**
   * CLIコマンドの設定
   */
  private setupCommands(): void {
    this.program
      .name('minecraft-bot')
      .description('Minecraft Bot management CLI')
      .version('2.0.0');

    // 設定関連コマンド
    this.setupConfigCommands();
    
    // ボット制御コマンド
    this.setupBotCommands();
    
    // 開発支援コマンド
    this.setupDevCommands();
  }

  /**
   * 設定関連コマンドの設定
   */
  private setupConfigCommands(): void {
    const configCmd = this.program
      .command('config')
      .description('Configuration management commands');

    configCmd
      .command('show')
      .description('Show current configuration')
      .option('-s, --summary', 'Show configuration summary')
      .option('-e, --env', 'Show as environment variables')
      .action((options) => {
        if (options.summary) {
          console.log(this.configManager.getConfigSummary());
        } else if (options.env) {
          console.log(this.configManager.exportToEnv());
        } else {
          console.log(JSON.stringify(this.configManager.getConfig(), null, 2));
        }
      });

    configCmd
      .command('validate')
      .description('Validate configuration')
      .action(() => {
        const validation = this.configManager.validateConfig();
        if (validation.isValid) {
          console.log('✓ Configuration is valid');
        } else {
          console.log('✗ Configuration has errors:');
          validation.errors.forEach(error => console.log(`  - ${error}`));
          process.exit(1);
        }
      });

    configCmd
      .command('create')
      .description('Create default configuration file')
      .option('-f, --force', 'Overwrite existing configuration')
      .action((options) => {
        const configPath = path.join(process.cwd(), 'bot.config.json');
        
        if (fs.existsSync(configPath) && !options.force) {
          console.log('Configuration file already exists. Use --force to overwrite.');
          process.exit(1);
        }
        
        this.configManager.createDefaultConfig();
      });

    configCmd
      .command('set <key> <value>')
      .description('Set configuration value')
      .action((key: string, value: string) => {
        try {
          // パースしてタイプを推定
          let parsedValue: any = value;
          if (value === 'true') parsedValue = true;
          else if (value === 'false') parsedValue = false;
          else if (!isNaN(Number(value))) parsedValue = Number(value);
          else if (value.includes(',')) parsedValue = value.split(',');

          // ネストされたキーの更新
          const keys = key.split('.');
          const update: any = {};
          let current = update;
          
          for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = {};
            current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = parsedValue;

          this.configManager.updateConfig(update);
          this.configManager.saveConfig();
          
          console.log(`✓ Updated ${key} = ${value}`);
        } catch (error) {
          console.error(`Failed to update configuration: ${error}`);
          process.exit(1);
        }
      });

    configCmd
      .command('get <key>')
      .description('Get configuration value')
      .action((key: string) => {
        const value = this.configManager.getValue(key);
        if (value !== undefined) {
          console.log(JSON.stringify(value, null, 2));
        } else {
          console.log(`Configuration key '${key}' not found`);
          process.exit(1);
        }
      });
  }

  /**
   * ボット制御コマンドの設定
   */
  private setupBotCommands(): void {
    this.program
      .command('start')
      .description('Start the Minecraft bot')
      .option('-d, --daemon', 'Run as daemon process')
      .option('-w, --watch', 'Watch for file changes and restart')
      .option('-c, --config <path>', 'Use custom config file')
      .action((options) => {
        if (options.config) {
          this.configManager = new ConfigManager(options.config);
        }

        const validation = this.configManager.validateConfig();
        if (!validation.isValid) {
          console.log('✗ Configuration validation failed:');
          validation.errors.forEach(error => console.log(`  - ${error}`));
          process.exit(1);
        }

        console.log('🤖 Starting Minecraft Bot...');
        console.log(this.configManager.getConfigSummary());
        
        if (options.watch) {
          this.startWithWatch();
        } else if (options.daemon) {
          this.startAsDaemon();
        } else {
          this.startBot();
        }
      });

    this.program
      .command('stop')
      .description('Stop the running bot')
      .action(() => {
        if (this.runningProcess) {
          console.log('🛑 Stopping bot...');
          this.runningProcess.kill('SIGTERM');
          this.runningProcess = null;
        } else {
          console.log('No bot process is currently running');
        }
      });

    this.program
      .command('restart')
      .description('Restart the bot')
      .option('-c, --config <path>', 'Use custom config file')
      .action((options) => {
        console.log('🔄 Restarting bot...');
        if (this.runningProcess) {
          this.runningProcess.kill('SIGTERM');
          this.runningProcess = null;
        }
        
        setTimeout(() => {
          if (options.config) {
            this.configManager = new ConfigManager(options.config);
          }
          this.startBot();
        }, 1000);
      });

    this.program
      .command('status')
      .description('Show bot status')
      .action(() => {
        if (this.runningProcess) {
          console.log('🟢 Bot is running');
          console.log(`Process ID: ${this.runningProcess.pid}`);
        } else {
          console.log('🔴 Bot is not running');
        }
        
        console.log('\nConfiguration:');
        console.log(this.configManager.getConfigSummary());
      });
  }

  /**
   * 開発支援コマンドの設定
   */
  private setupDevCommands(): void {
    const devCmd = this.program
      .command('dev')
      .description('Development utilities');

    devCmd
      .command('test')
      .description('Run tests')
      .option('-w, --watch', 'Watch mode')
      .option('-c, --coverage', 'Generate coverage report')
      .action((options) => {
        const args = ['test'];
        if (options.watch) args.push('--watch');
        if (options.coverage) args.push('--coverage');
        
        const testProcess = spawn('npm', ['run', ...args], {
          stdio: 'inherit',
          shell: true
        });
        
        testProcess.on('close', (code) => {
          process.exit(code || 0);
        });
      });

    devCmd
      .command('build')
      .description('Build the project')
      .option('-w, --watch', 'Watch mode')
      .action((options) => {
        const args = options.watch ? ['run', 'build', '--watch'] : ['run', 'build'];
        
        const buildProcess = spawn('npm', args, {
          stdio: 'inherit',
          shell: true
        });
        
        buildProcess.on('close', (code) => {
          process.exit(code || 0);
        });
      });

    devCmd
      .command('lint')
      .description('Run linter')
      .option('--fix', 'Auto-fix issues')
      .action((options) => {
        const args = ['run', 'lint'];
        if (options.fix) args.push('--', '--fix');
        
        const lintProcess = spawn('npm', args, {
          stdio: 'inherit',
          shell: true
        });
        
        lintProcess.on('close', (code) => {
          process.exit(code || 0);
        });
      });

    devCmd
      .command('generate-docs')
      .description('Generate documentation')
      .action(() => {
        console.log('📖 Generating documentation...');
        // TODO: Implement documentation generation
        console.log('Documentation generation not yet implemented');
      });
  }

  /**
   * 通常モードでボットを開始
   */
  private startBot(): void {
    try {
      this.runningProcess = spawn('npm', ['run', 'start'], {
        stdio: 'inherit',
        shell: true,
        env: {
          ...process.env,
          ...this.envFromConfig()
        }
      });

      this.runningProcess.on('close', (code) => {
        console.log(`Bot process exited with code ${code}`);
        this.runningProcess = null;
        
        if (code !== 0) {
          const config = this.configManager.getConfig();
          if (config.bot.maxRetries > 0) {
            console.log(`Retrying in ${config.bot.retryDelay}ms...`);
            setTimeout(() => this.startBot(), config.bot.retryDelay);
          }
        }
      });

      this.runningProcess.on('error', (error) => {
        console.error('Failed to start bot process:', error);
      });

    } catch (error) {
      console.error('Failed to start bot:', error);
      process.exit(1);
    }
  }

  /**
   * デーモンモードでボットを開始
   */
  private startAsDaemon(): void {
    const logFile = path.join(process.cwd(), 'bot.log');
    const pidFile = path.join(process.cwd(), 'bot.pid');

    console.log(`Starting bot as daemon, logs: ${logFile}`);
    
    this.runningProcess = spawn('npm', ['run', 'start'], {
      detached: true,
      stdio: ['ignore', fs.openSync(logFile, 'a'), fs.openSync(logFile, 'a')],
      shell: true,
      env: {
        ...process.env,
        ...this.envFromConfig()
      }
    });

    fs.writeFileSync(pidFile, String(this.runningProcess.pid));
    this.runningProcess.unref();
    
    console.log(`Bot started as daemon with PID: ${this.runningProcess.pid}`);
    process.exit(0);
  }

  /**
   * ファイル監視モードでボットを開始
   */
  private startWithWatch(): void {
    console.log('🔄 Starting bot in watch mode...');
    
    // ファイル監視の実装
    const chokidar = require('chokidar');
    const watcher = chokidar.watch(['src/**/*.ts', 'bot.config.json'], {
      ignored: /node_modules/,
      persistent: true
    });

    let restartTimeout: NodeJS.Timeout | null = null;

    watcher.on('change', (path: string) => {
      console.log(`📁 File changed: ${path}`);
      
      if (restartTimeout) {
        clearTimeout(restartTimeout);
      }
      
      restartTimeout = setTimeout(() => {
        if (this.runningProcess) {
          console.log('🔄 Restarting bot due to file changes...');
          this.runningProcess.kill('SIGTERM');
        }
        
        setTimeout(() => {
          this.configManager.reloadConfig();
          this.startBot();
        }, 1000);
      }, 1000);
    });

    this.startBot();
  }

  /**
   * 設定から環境変数を生成
   */
  private envFromConfig(): Record<string, string> {
    const config = this.configManager.getConfig();
    return {
      MC_HOST: config.server.host,
      MC_PORT: String(config.server.port),
      MC_VERSION: config.server.version,
      MC_USERNAME: config.bot.username,
      MC_AUTH: config.bot.auth,
      MC_AUTO_EAT: String(config.features.autoEat),
      MC_AUTO_RESPAWN: String(config.features.autoRespawn),
      MC_LOG_LEVEL: config.features.logLevel,
    };
  }

  /**
   * CLIを実行
   */
  public run(argv?: string[]): void {
    // プロセス終了時の処理
    process.on('SIGINT', () => {
      console.log('\n🛑 Received SIGINT, shutting down...');
      if (this.runningProcess) {
        this.runningProcess.kill('SIGTERM');
      }
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, shutting down...');
      if (this.runningProcess) {
        this.runningProcess.kill('SIGTERM');
      }
      process.exit(0);
    });

    this.program.parse(argv);
  }
}

// CLI実行のエントリーポイント
if (require.main === module) {
  const cli = new BotCLI();
  cli.run();
}