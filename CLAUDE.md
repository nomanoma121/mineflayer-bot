# CLAUDE.md
必ず日本語で回答してください。
適切にコミットしたり、、ブランチを切ること
This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a sophisticated Minecraft bot built with TypeScript that implements multiple design patterns including State Pattern, Command Pattern, Singleton Pattern, and Facade Pattern. The bot is designed as both a functional Minecraft automation tool and a learning resource for software design principles.

## Development Commands

### Build and Run
```bash
# Build TypeScript to JavaScript
npm run build

# Run the bot in production mode
npm run start

# Build and run in development mode
npm run dev

# Clean build artifacts
npm run clean
```

### Environment Setup
The bot requires a `.env` file with the following variables:
- `MC_HOST`: Minecraft server host (default: localhost)
- `MC_PORT`: Minecraft server port (default: 25565)
- `MC_USERNAME`: Bot username (default: Bot)
- `MC_AUTH`: Authentication type ("offline" or "microsoft", default: offline)
- `MC_VERSION`: Minecraft version (default: 1.20.1)

### Docker Support
```bash
# Run with Docker Compose
docker-compose up --build

# Run specific bot
docker-compose up bot00
```

## Architecture Overview

### Core Components

1. **Bot Class** (`src/core/Bot.ts`): Main facade that wraps mineflayer functionality and manages bot lifecycle
2. **CommandHandler** (`src/core/CommandHandler.ts`): Parses and executes chat commands using Command Pattern
3. **State System** (`src/states/`): Implements State Pattern for bot behavior management
4. **Command System** (`src/commands/`): Implements Command Pattern for chat command handling

### Key Design Patterns

- **State Pattern**: Bot states (Idle, Moving, Attacking, etc.) are separate classes implementing `IBotState`
- **Command Pattern**: Chat commands are objects implementing `ICommand` interface
- **Singleton Pattern**: State instances are singletons to optimize memory usage
- **Facade Pattern**: `Bot` class simplifies complex mineflayer API interactions
- **Ability System**: Modular capability system with separate ability classes for different functionalities

### Entry Point and Initialization

The application starts in `src/index.ts` which:
1. Loads environment variables from `.env`
2. Creates a `Bot` instance with configuration
3. Creates a `CommandHandler` and registers all available commands
4. Sets up event listeners for chat messages and bot lifecycle events
5. Initializes the bot in `IdleState`

### State Management

The bot uses a state machine where each state handles specific behaviors:
- States are implemented as classes extending `IBotState`
- States have `enter()`, `execute()`, and `exit()` lifecycle methods
- The main loop calls `execute()` every 100ms on the current state
- State transitions are handled through `Bot.changeState()`

### Command System

Commands are registered in the main function and handle chat messages:
- Commands implement the `ICommand` interface
- Chat messages are parsed by `CommandHandler`
- Commands can target specific bots (`@bot01 command`) or all bots (`@all command`)
- Commands have access to the bot instance for state changes and actions

### Ability System

The bot implements a modular ability system with the following capabilities:

#### Vitals (生命維持) ❤️‍🩹
- Health and hunger monitoring
- Automatic danger detection
- Safe spot location finding
- Vital statistics reporting

#### Sensing (知覚・認識) 🧐
- Entity detection and filtering
- Environment awareness (time, weather, light level)
- Player and mob proximity detection
- Block and item scanning

#### Inventory (所持品管理) 🎒
- Item counting and availability checking
- Tool and weapon selection
- Equipment management
- Chest interaction (basic implementation)

#### Say (発言) 💬
- Structured chat messaging
- Message history tracking
- Predefined message templates
- Status and error reporting

### Bot Features

The bot includes comprehensive Minecraft automation features:
- **Navigation**: Following players, pathfinding to coordinates, home base system
- **Combat**: Attacking entities, PvP functionality
- **Building**: Block placement and digging
- **Inventory**: Item management, giving/dropping items, equipment handling
- **Advanced Modes**: Farming, mining, lumberjacking, exploring, wandering
- **Automatic Features**: Hunger management with automatic eating
- **Ability Testing**: Use `@bot abilitytest <type>` to test different ability systems

### Dependencies

- **mineflayer**: Core Minecraft bot functionality
- **mineflayer-pathfinder**: Advanced pathfinding and movement
- **minecraft-data**: Minecraft game data (blocks, items, etc.)
- **dotenv**: Environment variable management
- **TypeScript**: Static typing and modern JavaScript features

## Development Notes

### Adding New Commands
1. Create a new command class in `src/commands/` implementing `ICommand`
2. Register the command in `src/index.ts` with `commandHandler.registerCommand()`
3. Commands receive bot instance, username, and parsed arguments

### Adding New States
1. Create a new state class in `src/states/` implementing `IBotState`
2. Implement singleton pattern with `getInstance()` method
3. Handle state lifecycle in `enter()`, `execute()`, and `exit()` methods
4. Trigger state changes through `bot.changeState()`

### Adding New Abilities
1. Create a new ability class in `src/abilities/` implementing `IAbility`
2. Implement required methods: `getName()`, `getDescription()`, `initialize()`, `isAvailable()`
3. Register the ability in `AbilityManager` constructor
4. Add getter method in `AbilityManager` for easy access
5. Access abilities through `bot.getAbilityManager()` or direct getters like `bot.vitals`

### Using Abilities in Commands and States
- Access abilities through bot instance: `bot.vitals.isHealthLow()`
- Use structured messaging: `bot.say.reportError("Error message")`
- Check inventory: `bot.inventory.hasItem("bread", 1)`
- Sense environment: `bot.sensing.isNight()`

### Bot Lifecycle
The bot automatically handles:
- Connection and reconnection to Minecraft servers
- Spawning and respawning
- Automatic food consumption when hunger is low
- Equipment management during eating
- Error handling and state recovery

### Performance Optimizations
- Pathfinder configured for fast movement with sprinting enabled
- State instances use singleton pattern for memory efficiency
- Main loop runs at 100ms intervals for responsive behavior
- Free motion allowed for flexible pathfinding

## Testing

Currently no automated tests are configured. The project uses manual testing with actual Minecraft servers.
