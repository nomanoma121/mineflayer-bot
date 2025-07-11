/**
 * 02_design_patterns 解答例
 * 
 * 各難易度の問題に対する完全な実装例です。
 */

// easy.ts の解答例
export class BotManagerSolution {
  private static instance: BotManagerSolution | null = null;
  private bots: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): BotManagerSolution {
    if (!BotManagerSolution.instance) {
      BotManagerSolution.instance = new BotManagerSolution();
    }
    return BotManagerSolution.instance;
  }

  public addBot(id: string, bot: any): void {
    this.bots.set(id, bot);
  }

  public getBot(id: string): any | undefined {
    return this.bots.get(id);
  }

  public getAllBots(): any[] {
    return Array.from(this.bots.values());
  }
}

// Factory Pattern解答例
export class CommandFactorySolution {
  public static createCommand(type: string, ...args: any[]): any {
    switch (type.toUpperCase()) {
      case 'SAY':
        return new SayCommandSolution(args[0] || '');
      case 'MOVE':
        return new MoveCommandSolution(args[0] || 'forward', args[1] || 1);
      case 'ATTACK':
        return new AttackCommandSolution(args[0] || 'nearest');
      default:
        throw new Error(`Unknown command type: ${type}`);
    }
  }
}

class SayCommandSolution {
  constructor(private message: string) {}
  
  public execute(): void {
    console.log(`Bot says: ${this.message}`);
  }
  
  public getType(): string {
    return 'SAY';
  }
}

class MoveCommandSolution {
  constructor(private direction: string, private distance: number) {}
  
  public execute(): void {
    console.log(`Bot moves ${this.direction} by ${this.distance}`);
  }
  
  public getType(): string {
    return 'MOVE';
  }
}

class AttackCommandSolution {
  constructor(private target: string) {}
  
  public execute(): void {
    console.log(`Bot attacks ${this.target}`);
  }
  
  public getType(): string {
    return 'ATTACK';
  }
}

// Observer Pattern解答例
export class BotEventSubjectSolution {
  private observers: any[] = [];

  public addObserver(observer: any): void {
    this.observers.push(observer);
  }

  public removeObserver(observer: any): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) {
      this.observers.splice(index, 1);
    }
  }

  public notifyObservers(eventType: string, data: any): void {
    this.observers.forEach(observer => {
      observer.onBotEvent(eventType, data);
    });
  }

  public emitBotEvent(eventType: string, data: any): void {
    this.notifyObservers(eventType, data);
  }
}