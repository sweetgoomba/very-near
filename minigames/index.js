

import https from "https";
import fs from "fs";
import dotenv from "dotenv";
import express from "express";

// 리액트 공홈 보고 신지 추가
import path from "path";

const app = express();
dotenv.config();

const ssl_options = {
  ca: fs.readFileSync("/etc/letsencrypt/live/loveplant.shop/fullchain.pem"),
  key: fs.readFileSync("/etc/letsencrypt/live/loveplant.shop/privkey.pem"),
  cert: fs.readFileSync("/etc/letsencrypt/live/loveplant.shop/cert.pem"),
};

app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
// 리액트 빌드 파일이 있는 디렉토리를 express.static으로 제공합니다.
// app.use(express.static('/usr/local/games/dist'));
app.use(express.static('/usr/local/games/crossword-tutorial-chapter-2/dist'));

//// chatGPT : 한국어해결
//app.use(function(req, res, next) {
  //res.setHeader('Content-Type', 'text/html; charset=utf-8');
  //next();
//});



//app.get("/", (req, res) => {
  //res.sendStatus(200);
//});

//// 리액트 공홈 보고 신지 추가
//app.use(express.static(path.join(__dirname, 'build')));

//// 리액트 공홈 보고 신지 추가
//app.get('/*', function (req, res) {
  //res.sendFile(path.join(__dirname, 'build', 'index.html'));
//});


// 신지 - 에러잡는 코드 추가
app.use((err, req, res, next) => { // 에러 처리 부분
    console.error(err.stack); // 에러 메시지 표시
    res.status(500).send('서버 에러!'); // 500 상태 표시 후 에러 메시지 전송
});

// Create an HTTPS service identical to the HTTP service.
https
  .createServer(ssl_options, app)
  .listen(7777, () => console.log("Server Up and running at 7777"));
