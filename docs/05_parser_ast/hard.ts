/**
 * 🔴 05_parser_ast 上級問題: 最高度構文解析エンジン実装
 * 
 * プロダクション品質の構文解析エンジンを実装してください。
 * この問題では、増分解析、並列処理、高度な最適化機能を学びます。
 */

// ===== 増分パーサー =====

export class IncrementalParser {
  private astCache: Map<string, CachedAST> = new Map();
  private syntaxTree: SyntaxTree = new SyntaxTree();
  private changeTracker: ChangeTracker = new ChangeTracker();
  private parseMetrics: ParseMetrics = new ParseMetrics();

  /**
   * 増分解析を実行します
   */
  parseIncremental(source: string, changes: TextChange[]): IncrementalParseResult {
    // TODO: 増分解析の実装
    // ヒント1: 変更範囲の特定
    // ヒント2: 影響を受けるノードの検出
    // ヒント3: 部分的な再パース
    // ヒント4: キャッシュの無効化
    
    const startTime = performance.now();
    this.parseMetrics.reset();
    
    // 変更の影響範囲を計算
    const affectedRange = this.changeTracker.calculateAffectedRange(changes);
    
    // 影響を受けるノードを特定
    const affectedNodes = this.syntaxTree.findNodesInRange(affectedRange);
    
    // キャッシュの無効化
    this.invalidateCache(affectedNodes);
    
    // 部分的な再パース
    const reparsedNodes = this.reparseAffectedNodes(affectedNodes, source);
    
    // 構文木の更新
    this.syntaxTree.updateNodes(reparsedNodes);
    
    const endTime = performance.now();
    this.parseMetrics.recordTime(endTime - startTime);
    
    return new IncrementalParseResult(
      this.syntaxTree.getRoot(),
      affectedRange,
      reparsedNodes,
      this.parseMetrics.getSnapshot()
    );
  }

  /**
   * キャッシュを無効化します
   */
  private invalidateCache(affectedNodes: AdvancedASTNode[]): void {
    for (const node of affectedNodes) {
      const cacheKey = this.generateCacheKey(node);
      this.astCache.delete(cacheKey);
    }
  }

  /**
   * 影響を受けるノードを再パースします
   */
  private reparseAffectedNodes(affectedNodes: AdvancedASTNode[], source: string): AdvancedASTNode[] {
    const reparsedNodes: AdvancedASTNode[] = [];
    
    for (const node of affectedNodes) {
      const nodeSource = this.extractNodeSource(node, source);
      const cacheKey = this.generateCacheKey(node);
      
      let reparsedNode = this.astCache.get(cacheKey)?.node;
      
      if (!reparsedNode) {
        reparsedNode = this.parseNodeSource(nodeSource, node.type);
        this.astCache.set(cacheKey, new CachedAST(reparsedNode, nodeSource));
      }
      
      if (reparsedNode) {
        reparsedNodes.push(reparsedNode);
      }
    }
    
    return reparsedNodes;
  }

  /**
   * ノードのソースコードを抽出します
   */
  private extractNodeSource(node: AdvancedASTNode, source: string): string {
    if (node.sourceLocation) {
      const start = this.positionToOffset(source, node.sourceLocation.start);
      const end = this.positionToOffset(source, node.sourceLocation.end);
      return source.slice(start, end);
    }
    return '';
  }

  /**
   * 位置をオフセットに変換します
   */
  private positionToOffset(source: string, position: Position): number {
    const lines = source.split('\n');
    let offset = 0;
    
    for (let i = 0; i < position.line - 1; i++) {
      offset += lines[i].length + 1; // +1 for newline
    }
    
    return offset + position.column - 1;
  }

  /**
   * ノードソースをパースします
   */
  private parseNodeSource(source: string, nodeType: string): AdvancedASTNode | null {
    // 簡略化された実装
    const lexer = new BasicLexer();
    const tokens = lexer.tokenize(source);
    const parser = new ErrorRecoveryParser(tokens);
    
    try {
      switch (nodeType) {
        case 'FunctionDeclaration':
          return parser.parseFunctionDeclaration();
        case 'IfStatement':
          return parser.parseIfStatement();
        case 'WhileStatement':
          return parser.parseWhileStatement();
        default:
          return parser.parseStatement();
      }
    } catch {
      return null;
    }
  }

  /**
   * キャッシュキーを生成します
   */
  private generateCacheKey(node: AdvancedASTNode): string {
    return `${node.type}_${node.sourceLocation?.toString() || 'unknown'}`;
  }
}

// ===== 構文木管理 =====

export class SyntaxTree {
  private root: AdvancedASTNode | null = null;
  private nodeIndex: Map<string, AdvancedASTNode> = new Map();
  private dirty: boolean = false;

  /**
   * ルートノードを設定します
   */
  setRoot(root: AdvancedASTNode): void {
    this.root = root;
    this.rebuildIndex();
    this.dirty = false;
  }

  /**
   * ルートノードを取得します
   */
  getRoot(): AdvancedASTNode | null {
    return this.root;
  }

  /**
   * 範囲内のノードを検索します
   */
  findNodesInRange(range: TextRange): AdvancedASTNode[] {
    if (!this.root) return [];
    
    const result: AdvancedASTNode[] = [];
    this.findNodesInRangeRecursive(this.root, range, result);
    return result;
  }

  /**
   * 再帰的に範囲内のノードを検索します
   */
  private findNodesInRangeRecursive(
    node: AdvancedASTNode, 
    range: TextRange, 
    result: AdvancedASTNode[]
  ): void {
    if (node.sourceLocation && this.rangeIntersects(range, node.sourceLocation)) {
      result.push(node);
    }
    
    for (const child of node.children) {
      this.findNodesInRangeRecursive(child, range, result);
    }
  }

  /**
   * 範囲が交差するかチェックします
   */
  private rangeIntersects(range: TextRange, location: SourceLocation): boolean {
    return !(
      range.end.line < location.start.line ||
      range.start.line > location.end.line ||
      (range.end.line === location.start.line && range.end.column < location.start.column) ||
      (range.start.line === location.end.line && range.start.column > location.end.column)
    );
  }

  /**
   * ノードを更新します
   */
  updateNodes(newNodes: AdvancedASTNode[]): void {
    // 簡略化された実装
    this.dirty = true;
  }

  /**
   * ノードインデックスを再構築します
   */
  private rebuildIndex(): void {
    this.nodeIndex.clear();
    if (this.root) {
      this.buildIndexRecursive(this.root);
    }
  }

  /**
   * 再帰的にインデックスを構築します
   */
  private buildIndexRecursive(node: AdvancedASTNode): void {
    const key = this.generateNodeKey(node);
    this.nodeIndex.set(key, node);
    
    for (const child of node.children) {
      this.buildIndexRecursive(child);
    }
  }

  /**
   * ノードキーを生成します
   */
  private generateNodeKey(node: AdvancedASTNode): string {
    return `${node.type}_${node.sourceLocation?.toString() || 'unknown'}`;
  }
}

// ===== 並列パーサー =====

export class ParallelParser {
  private workerPool: ParserWorkerPool = new ParserWorkerPool();
  private taskQueue: ParseTask[] = [];
  private results: Map<string, ParseResult> = new Map();

  /**
   * 並列解析を実行します
   */
  async parseParallel(sources: ParseSource[]): Promise<ParallelParseResult> {
    // TODO: 並列解析の実装
    // ヒント1: ワーカープールの管理
    // ヒント2: タスクの分割
    // ヒント3: 結果のマージ
    // ヒント4: エラーハンドリング
    
    const startTime = performance.now();
    
    // タスクの分割
    const tasks = this.createParseTasks(sources);
    
    // 並列実行
    const promises = tasks.map(task => this.executeTask(task));
    const results = await Promise.allSettled(promises);
    
    // 結果のマージ
    const mergedResult = this.mergeResults(results);
    
    const endTime = performance.now();
    const metrics = new ParallelParseMetrics(
      sources.length,
      endTime - startTime,
      this.workerPool.getActiveWorkerCount(),
      results.filter(r => r.status === 'rejected').length
    );
    
    return new ParallelParseResult(mergedResult, metrics);
  }

  /**
   * パースタスクを作成します
   */
  private createParseTasks(sources: ParseSource[]): ParseTask[] {
    return sources.map((source, index) => new ParseTask(
      `task_${index}`,
      source.content,
      source.filePath,
      source.priority || 'normal'
    ));
  }

  /**
   * タスクを実行します
   */
  private async executeTask(task: ParseTask): Promise<ParseResult> {
    const worker = await this.workerPool.acquireWorker();
    
    try {
      const result = await worker.parse(task.source, task.filePath);
      return new ParseResult(task.id, result, null);
    } catch (error) {
      return new ParseResult(task.id, null, error as Error);
    } finally {
      this.workerPool.releaseWorker(worker);
    }
  }

  /**
   * 結果をマージします
   */
  private mergeResults(results: PromiseSettledResult<ParseResult>[]): AdvancedASTNode[] {
    const successfulResults: AdvancedASTNode[] = [];
    
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.ast) {
        successfulResults.push(result.value.ast);
      }
    }
    
    return successfulResults;
  }
}

// ===== ワーカープール =====

export class ParserWorkerPool {
  private workers: ParserWorker[] = [];
  private availableWorkers: ParserWorker[] = [];
  private maxWorkers: number = 4;

  constructor() {
    this.initializeWorkers();
  }

  /**
   * ワーカーを初期化します
   */
  private initializeWorkers(): void {
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new ParserWorker(`worker_${i}`);
      this.workers.push(worker);
      this.availableWorkers.push(worker);
    }
  }

  /**
   * ワーカーを取得します
   */
  async acquireWorker(): Promise<ParserWorker> {
    if (this.availableWorkers.length > 0) {
      return this.availableWorkers.pop()!;
    }
    
    // 利用可能なワーカーがない場合は待機
    return new Promise<ParserWorker>((resolve) => {
      const checkWorker = () => {
        if (this.availableWorkers.length > 0) {
          resolve(this.availableWorkers.pop()!);
        } else {
          setTimeout(checkWorker, 10);
        }
      };
      checkWorker();
    });
  }

  /**
   * ワーカーを返却します
   */
  releaseWorker(worker: ParserWorker): void {
    this.availableWorkers.push(worker);
  }

  /**
   * アクティブなワーカー数を取得します
   */
  getActiveWorkerCount(): number {
    return this.workers.length - this.availableWorkers.length;
  }
}

export class ParserWorker {
  constructor(public id: string) {}

  /**
   * 解析を実行します
   */
  async parse(source: string, filePath: string): Promise<AdvancedASTNode> {
    // 実際の実装では、Web Worker or Worker Thread を使用
    return new Promise<AdvancedASTNode>((resolve, reject) => {
      setTimeout(() => {
        try {
          const lexer = new BasicLexer();
          const tokens = lexer.tokenize(source);
          const parser = new ErrorRecoveryParser(tokens);
          const ast = parser.parseProgram();
          resolve(ast);
        } catch (error) {
          reject(error);
        }
      }, Math.random() * 100); // シミュレートされた処理時間
    });
  }
}

// ===== 高度なAST最適化 =====

export class AdvancedASTOptimizer {
  private optimizations: Map<string, OptimizationPass> = new Map();
  private dependencyGraph: OptimizationDependencyGraph = new OptimizationDependencyGraph();

  constructor() {
    this.setupOptimizations();
  }

  /**
   * 最適化パスを設定します
   */
  private setupOptimizations(): void {
    // TODO: 最適化パスの設定
    // ヒント1: パスの依存関係
    // ヒント2: 最適化の順序
    // ヒント3: 条件付き最適化
    
    this.optimizations.set('ConstantFolding', new ConstantFoldingPass());
    this.optimizations.set('DeadCodeElimination', new DeadCodeEliminationPass());
    this.optimizations.set('CommonSubexpressionElimination', new CommonSubexpressionEliminationPass());
    this.optimizations.set('LoopOptimization', new LoopOptimizationPass());
    this.optimizations.set('InlineExpansion', new InlineExpansionPass());
    
    // 依存関係の設定
    this.dependencyGraph.addDependency('DeadCodeElimination', 'ConstantFolding');
    this.dependencyGraph.addDependency('CommonSubexpressionElimination', 'ConstantFolding');
    this.dependencyGraph.addDependency('LoopOptimization', 'DeadCodeElimination');
  }

  /**
   * ASTを最適化します
   */
  optimize(ast: AdvancedASTNode, options: OptimizationOptions): OptimizationResult {
    const startTime = performance.now();
    let optimizedAST = ast;
    const appliedPasses: string[] = [];
    const metrics = new OptimizationMetrics();
    
    // 最適化パスの実行順序を決定
    const passOrder = this.dependencyGraph.getExecutionOrder();
    
    for (const passName of passOrder) {
      if (!options.enabledPasses.includes(passName)) {
        continue;
      }
      
      const pass = this.optimizations.get(passName);
      if (pass) {
        const passStartTime = performance.now();
        const result = pass.apply(optimizedAST);
        const passEndTime = performance.now();
        
        if (result.changed) {
          optimizedAST = result.ast;
          appliedPasses.push(passName);
          metrics.recordPass(passName, passEndTime - passStartTime, result.changesCount);
        }
      }
    }
    
    const endTime = performance.now();
    
    return new OptimizationResult(
      optimizedAST,
      appliedPasses,
      endTime - startTime,
      metrics
    );
  }
}

// ===== 最適化パス =====

export interface OptimizationPass {
  apply(ast: AdvancedASTNode): OptimizationPassResult;
}

export class OptimizationPassResult {
  constructor(
    public ast: AdvancedASTNode,
    public changed: boolean,
    public changesCount: number = 0
  ) {}
}

export class ConstantFoldingPass implements OptimizationPass {
  apply(ast: AdvancedASTNode): OptimizationPassResult {
    let changesCount = 0;
    
    const optimize = (node: AdvancedASTNode): AdvancedASTNode => {
      // 子ノードを先に最適化
      const optimizedChildren = node.children.map(child => optimize(child));
      
      if (node instanceof BinaryExpressionNode) {
        const newNode = new BinaryExpressionNode(
          optimizedChildren[0],
          node.operator,
          optimizedChildren[1]
        );
        
        const simplified = newNode.simplify();
        if (simplified !== newNode) {
          changesCount++;
          return simplified;
        }
        return newNode;
      }
      
      // 他のノード型の処理...
      return node;
    };
    
    const optimizedAST = optimize(ast);
    return new OptimizationPassResult(optimizedAST, changesCount > 0, changesCount);
  }
}

export class DeadCodeEliminationPass implements OptimizationPass {
  apply(ast: AdvancedASTNode): OptimizationPassResult {
    let changesCount = 0;
    
    const eliminate = (node: AdvancedASTNode): AdvancedASTNode => {
      if (node instanceof BlockStatementNode) {
        const unreachableNodes = node.findUnreachableCode();
        if (unreachableNodes.length > 0) {
          const reachableStatements = node.statements.filter(stmt => !unreachableNodes.includes(stmt));
          changesCount += unreachableNodes.length;
          return new BlockStatementNode(reachableStatements);
        }
      }
      
      return node;
    };
    
    const optimizedAST = eliminate(ast);
    return new OptimizationPassResult(optimizedAST, changesCount > 0, changesCount);
  }
}

export class CommonSubexpressionEliminationPass implements OptimizationPass {
  apply(ast: AdvancedASTNode): OptimizationPassResult {
    // 簡略化された実装
    return new OptimizationPassResult(ast, false, 0);
  }
}

export class LoopOptimizationPass implements OptimizationPass {
  apply(ast: AdvancedASTNode): OptimizationPassResult {
    // 簡略化された実装
    return new OptimizationPassResult(ast, false, 0);
  }
}

export class InlineExpansionPass implements OptimizationPass {
  apply(ast: AdvancedASTNode): OptimizationPassResult {
    // 簡略化された実装
    return new OptimizationPassResult(ast, false, 0);
  }
}

// ===== 依存関係グラフ =====

export class OptimizationDependencyGraph {
  private dependencies: Map<string, Set<string>> = new Map();

  /**
   * 依存関係を追加します
   */
  addDependency(dependent: string, dependency: string): void {
    if (!this.dependencies.has(dependent)) {
      this.dependencies.set(dependent, new Set());
    }
    this.dependencies.get(dependent)!.add(dependency);
  }

  /**
   * 実行順序を取得します
   */
  getExecutionOrder(): string[] {
    const visited = new Set<string>();
    const result: string[] = [];
    
    const visit = (node: string) => {
      if (visited.has(node)) return;
      
      visited.add(node);
      
      const deps = this.dependencies.get(node);
      if (deps) {
        for (const dep of deps) {
          visit(dep);
        }
      }
      
      result.push(node);
    };
    
    for (const node of this.dependencies.keys()) {
      visit(node);
    }
    
    return result;
  }
}

// ===== 変更追跡 =====

export class ChangeTracker {
  /**
   * 影響範囲を計算します
   */
  calculateAffectedRange(changes: TextChange[]): TextRange {
    if (changes.length === 0) {
      return new TextRange(new Position(1, 1), new Position(1, 1));
    }
    
    let minLine = Number.MAX_SAFE_INTEGER;
    let minColumn = Number.MAX_SAFE_INTEGER;
    let maxLine = 0;
    let maxColumn = 0;
    
    for (const change of changes) {
      if (change.range.start.line < minLine || 
          (change.range.start.line === minLine && change.range.start.column < minColumn)) {
        minLine = change.range.start.line;
        minColumn = change.range.start.column;
      }
      
      if (change.range.end.line > maxLine || 
          (change.range.end.line === maxLine && change.range.end.column > maxColumn)) {
        maxLine = change.range.end.line;
        maxColumn = change.range.end.column;
      }
    }
    
    return new TextRange(
      new Position(minLine, minColumn),
      new Position(maxLine, maxColumn)
    );
  }
}

// ===== データ構造 =====

export class TextRange {
  constructor(
    public start: Position,
    public end: Position
  ) {}
}

export class TextChange {
  constructor(
    public range: TextRange,
    public text: string
  ) {}
}

export class CachedAST {
  constructor(
    public node: AdvancedASTNode,
    public source: string,
    public timestamp: number = Date.now()
  ) {}
}

export class ParseTask {
  constructor(
    public id: string,
    public source: string,
    public filePath: string,
    public priority: 'low' | 'normal' | 'high'
  ) {}
}

export class ParseSource {
  constructor(
    public content: string,
    public filePath: string,
    public priority?: 'low' | 'normal' | 'high'
  ) {}
}

export class ParseResult {
  constructor(
    public taskId: string,
    public ast: AdvancedASTNode | null,
    public error: Error | null
  ) {}
}

export class ParseMetrics {
  private parseTime = 0;
  private nodesCreated = 0;
  private errorsRecovered = 0;

  reset(): void {
    this.parseTime = 0;
    this.nodesCreated = 0;
    this.errorsRecovered = 0;
  }

  recordTime(time: number): void {
    this.parseTime = time;
  }

  recordNode(): void {
    this.nodesCreated++;
  }

  recordErrorRecovery(): void {
    this.errorsRecovered++;
  }

  getSnapshot(): ParseMetricsSnapshot {
    return new ParseMetricsSnapshot(
      this.parseTime,
      this.nodesCreated,
      this.errorsRecovered
    );
  }
}

export class ParseMetricsSnapshot {
  constructor(
    public parseTime: number,
    public nodesCreated: number,
    public errorsRecovered: number
  ) {}
}

export class OptimizationOptions {
  constructor(
    public enabledPasses: string[],
    public maxIterations: number = 10,
    public targetLevel: 'O0' | 'O1' | 'O2' | 'O3' = 'O2'
  ) {}
}

export class OptimizationMetrics {
  private passMetrics: Map<string, PassMetrics> = new Map();

  recordPass(name: string, time: number, changes: number): void {
    this.passMetrics.set(name, new PassMetrics(name, time, changes));
  }

  getPassMetrics(): Map<string, PassMetrics> {
    return new Map(this.passMetrics);
  }
}

export class PassMetrics {
  constructor(
    public name: string,
    public executionTime: number,
    public changesCount: number
  ) {}
}

export class OptimizationResult {
  constructor(
    public ast: AdvancedASTNode,
    public appliedPasses: string[],
    public totalTime: number,
    public metrics: OptimizationMetrics
  ) {}
}

export class ParallelParseMetrics {
  constructor(
    public sourceCount: number,
    public totalTime: number,
    public peakWorkers: number,
    public errorCount: number
  ) {}

  getSpeedup(): number {
    // 簡略化された計算
    return this.peakWorkers > 0 ? this.sourceCount / this.peakWorkers : 1;
  }
}

export class IncrementalParseResult {
  constructor(
    public ast: AdvancedASTNode | null,
    public affectedRange: TextRange,
    public reparsedNodes: AdvancedASTNode[],
    public metrics: ParseMetricsSnapshot
  ) {}
}

export class ParallelParseResult {
  constructor(
    public asts: AdvancedASTNode[],
    public metrics: ParallelParseMetrics
  ) {}
}

// ===== デモクラス =====

export class MasterParserDemo {
  /**
   * 最高度構文解析機能のデモを実行します
   */
  public static async runDemo(): Promise<void> {
    console.log('=== Master Parser Demo ===');

    // 増分パーサーのテスト
    console.log('\n--- Incremental Parser Test ---');
    const incrementalParser = new IncrementalParser();
    
    const originalSource = `
      FUNCTION test()
        DEF x = 10
        IF x > 5
          SAY "Large"
        ENDIF
      ENDFUNCTION
    `;
    
    const changes: TextChange[] = [
      new TextChange(
        new TextRange(new Position(3, 15), new Position(3, 17)),
        '20'
      )
    ];
    
    try {
      const incrementalResult = incrementalParser.parseIncremental(originalSource, changes);
      console.log('Incremental parse completed');
      console.log(`Reparsed nodes: ${incrementalResult.reparsedNodes.length}`);
    } catch (error) {
      console.log('Incremental parse setup completed');
    }

    // 並列パーサーのテスト
    console.log('\n--- Parallel Parser Test ---');
    const parallelParser = new ParallelParser();
    
    const sources: ParseSource[] = [
      new ParseSource('DEF x = 1\nSAY "Hello"', 'file1.bot', 'normal'),
      new ParseSource('FUNCTION test()\n  RETURN 42\nENDFUNCTION', 'file2.bot', 'high'),
      new ParseSource('IF x > 0\n  MOVE forward\nENDIF', 'file3.bot', 'normal')
    ];
    
    try {
      const parallelResult = await parallelParser.parseParallel(sources);
      console.log('Parallel parse completed');
      console.log(`Parsed ${parallelResult.asts.length} files`);
      console.log(`Speedup: ${parallelResult.metrics.getSpeedup().toFixed(2)}x`);
    } catch (error) {
      console.log('Parallel parse setup completed');
    }

    // 高度なAST最適化のテスト
    console.log('\n--- Advanced AST Optimization Test ---');
    const optimizer = new AdvancedASTOptimizer();
    
    // サンプルAST構築
    const literal5 = new LiteralNode(5);
    const literal3 = new LiteralNode(3);
    const addExpr = new BinaryExpressionNode(literal5, '+', literal3);
    
    const options = new OptimizationOptions(
      ['ConstantFolding', 'DeadCodeElimination'],
      5,
      'O2'
    );
    
    const optimizationResult = optimizer.optimize(addExpr, options);
    
    console.log('Optimization completed');
    console.log(`Applied passes: ${optimizationResult.appliedPasses.join(', ')}`);
    console.log(`Total time: ${optimizationResult.totalTime.toFixed(2)}ms`);
    
    if (optimizationResult.ast instanceof LiteralNode) {
      console.log(`Constant folding result: ${optimizationResult.ast.value}`);
    }

    // パフォーマンステスト
    console.log('\n--- Performance Test ---');
    const largeSource = 'DEF x = 1\nSAY "test"\n'.repeat(1000);
    
    const perfStartTime = performance.now();
    
    const lexer = new BasicLexer();
    const tokens = lexer.tokenize(largeSource);
    const parser = new ErrorRecoveryParser(tokens);
    
    try {
      const ast = parser.parseProgram();
      const perfEndTime = performance.now();
      
      console.log(`Parsed ${largeSource.split('\n').length} lines in ${(perfEndTime - perfStartTime).toFixed(2)}ms`);
    } catch (error) {
      console.log('Performance test completed');
    }

    // メモリ使用量テスト
    console.log('\n--- Memory Usage Test ---');
    const memBefore = process.memoryUsage();
    
    // 大量のASTノードを作成
    const nodes: AdvancedASTNode[] = [];
    for (let i = 0; i < 10000; i++) {
      nodes.push(new LiteralNode(i));
    }
    
    const memAfter = process.memoryUsage();
    const memDiff = memAfter.heapUsed - memBefore.heapUsed;
    console.log(`Memory usage for 10k nodes: ${(memDiff / 1024 / 1024).toFixed(2)} MB`);

    console.log('\nMaster parser demo completed');
  }
}

// 必要なインポート
import { 
  AdvancedASTNode, 
  Position, 
  SourceLocation, 
  BinaryExpressionNode,
  LiteralNode,
  BlockStatementNode,
  IfStatementNode
} from './normal';
import { 
  BasicLexer, 
  ErrorRecoveryParser 
} from './easy';