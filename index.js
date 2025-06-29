// 必要なライブラリを読み込み
const mineflayer = require('mineflayer');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const { GoalFollow } = require('mineflayer-pathfinder').goals;

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
  // サーバー参加時に挨拶する
  bot.chat('追従ボット、スタンバイOK！「ついてきて」と呼んでね。');
});

// 2. チャットメッセージを受け取った時の処理
bot.on('chat', (username, message) => {
  // 自分のチャットは無視する
  if (username === bot.username) return;

  // コマンドのトリガーとなるプレイヤー情報を取得
  const target = bot.players[username]?.entity;
  if (!target) return;

  // ▼「ついてきて」コマンド
  if (message.trim() === 'ついてきて') {
    bot.chat(`${username}さんを追いかけます！`);
    
    // 移動設定を準備
    const mcData = require('minecraft-data')(bot.version);
    const movements = new Movements(bot, mcData);
    bot.pathfinder.setMovements(movements);
    
    // 目標（ゴール）を「プレイヤーを1ブロックの距離で追従し続ける」に設定
    const goal = new GoalFollow(target, 1);
    bot.pathfinder.setGoal(goal, true); // trueにすると目標を追いかけ続ける
  }

  // ▼「とまれ」コマンド
  if (message.trim() === 'とまれ') {
    bot.chat('その場で停止します。');
    // 目標を解除して移動を停止する
    bot.pathfinder.stop();
  }
});

// 3. エラー処理と切断処理
bot.on('error', err => console.error('エラーが発生しました:', err));
bot.on('end', reason => console.log(`接続が切断されました: ${reason}`));
