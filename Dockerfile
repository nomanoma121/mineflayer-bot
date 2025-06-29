# ベースとなるNode.js v18の軽量イメージを指定
FROM node:18-alpine

# コンテナ内の作業ディレクトリを作成し、移動
WORKDIR /usr/src/app

# まずpackage.jsonをコピーして、ライブラリをインストール
# これにより、コード変更のたびにインストールが走るのを防ぎ、効率化できる
COPY package*.json ./
RUN npm install

# プロジェクトの全ファイルをコンテナ内にコピー
COPY . .

# コンテナ起動時に実行するコマンド
CMD [ "node", "index.js" ]
