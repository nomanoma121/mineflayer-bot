// 必要なライブラリを読み込み
const mineflayer = require('mineflayer');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const { GoalFollow, GoalBlock } = require('mineflayer-pathfinder').goals;

// Dockerから渡される「環境変数」を使って、ボットの設定を定義
const options = {
  host: process.env.MC_HOST, // サーバーのIPアドレス
  port: parseInt(process.env.MC_PORT), // サーバーのポート番号
  username: process.env.MC_USERNAME, // ボットの名前
  auth: process.env.MC_AUTH, // 認証方法 (今回は'offline')
  version: process.env.MC_VERSION // サーバーのバージョン
};

// ボットを作成
const bot = mineflayer.createBot(options);

// 重要なプラグイン「pathfinder」をボットに読み込ませる
bot.loadPlugin(pathfinder);

// --- イベント処理 ---

// 1. サーバーにログインした時の処理
bot.on('login', () => {
  console.log(`ボット ${bot.username} がサーバーにログインしました。`);
});

// 2. ワールドに初めてスポーンした時の処理（整列と挨拶）
bot.once('spawn', () => {
  console.log(`[${bot.username}] ワールドにスポーンしました。`);

  // pathfinderの移動設定を準備
  const mcData = require('minecraft-data')(bot.version);
  const movements = new Movements(bot, mcData);
  bot.pathfinder.setMovements(movements);

  // --- ここからが整列処理 ---
  // ボット名から番号を取得 (例: 'bot05' -> 5)
  const botNumber = parseInt(bot.username.replace('bot', ''), 10);

  // スポーン地点を基準に、ボットごとのユニークな目標座標を計算
  const spawnPoint = bot.entity.position;
  const offsetX = botNumber % 5; // 5x2の格子状に並ぶ
  const offsetZ = Math.floor(botNumber / 5);

  const targetX = Math.floor(spawnPoint.x) + offsetX;
  const targetY = Math.floor(spawnPoint.y);
  const targetZ = Math.floor(spawnPoint.z) + offsetZ;

  console.log(`[${bot.username}] 整列を開始します。目標座標: (${targetX}, ${targetY}, ${targetZ})`);
  
  // 計算した座標を目標(Goal)に設定して移動開始
  const goal = new GoalBlock(targetX, targetY, targetZ);
  bot.pathfinder.setGoal(goal);

  // 目標に到着したら、挨拶する
  bot.once('goal_reached', () => {
    console.log(`[${bot.username}] 整列完了。`);
    bot.chat('追従ボット、スタンバイOK！「ついてきて」と呼んでね。');
  });
});

// 3. チャットメッセージを受け取った時の処理
bot.on('chat', (username, message) => {
  // 自分のチャットは無視する
  if (username === bot.username) return;

  // コマンドのトリガーとなるプレイヤー情報を取得
  const target = bot.players[username]?.entity;
  if (!target) return;

  // ▼「ついてきて」コマンド
  if (message.trim() === 'ついてきて') {
    bot.chat(`${username}さんを追いかけます！`);
    
    // 目標（ゴール）を「プレイヤーを1ブロックの距離で追従し続ける」に設定
    // ※移動設定はspawn時に済んでいるのでここでは不要
    const followGoal = new GoalFollow(target, 1);
    bot.pathfinder.setGoal(followGoal, true); // trueにすると目標を追いかけ続ける
  }

  // ▼「とまれ」コマンド
  if (message.trim() === 'とまれ') {
    bot.chat('その場で停止します。');
    // 目標を解除して移動を停止する
    bot.pathfinder.stop();
  }
});

// 4. エラー処理と切断処理
bot.on('error', err => console.error(`[${bot.username}] エラーが発生しました:`, err));
bot.on('end', reason => console.log(`[${bot.username}] 接続が切断されました: ${reason}`));
