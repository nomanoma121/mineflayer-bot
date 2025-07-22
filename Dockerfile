# ベースとなるNode.js v18の軽量イメージを指定
FROM node:18-alpine

# pnpmをインストール
RUN npm install -g pnpm

# コンテナ内の作業ディレクトリを作成し、移動
WORKDIR /usr/src/app

# まずpackage.jsonをコピーして、ライブラリをインストール
# これにより、コード変更のたびにインストールが走るのを防ぎ、効率化できる
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json ./
RUN pnpm install

# プロジェクトの全ファイルをコンテナ内にコピー
COPY . .

# TypeScriptをビルド
RUN pnpm run build

# コンテナ起動時に実行するコマンド
CMD [ "pnpm", "start" ]
