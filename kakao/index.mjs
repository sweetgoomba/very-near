import express from 'express';
import https from 'https';
import fs from 'fs';
//import path from 'path';
import turl from 'turl';
import mysql from 'mysql';
import nearAPI from 'near-api-js';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();
// near setting
const nearConfig = {
  networkId: "testnet", // 네트워크 ID (mainnet, testnet, betanet 등)
  nodeUrl: "https://rpc.testnet.near.org", // NEAR 노드의 URL
  walletUrl: "https://wallet.testnet.near.org", // NEAR 지갑의 URL
  helperUrl: "https://helper.testnet.near.org", // NEAR 헬퍼의 URL
  explorerUrl: 'https://explorer.testnet.near.org',
};

//////////////////////// near-api-js 세팅하는 부분
const { actionCreators } = '@near-js/transactions';
const keyStore = new nearAPI.keyStores.InMemoryKeyStore();
const near = await nearAPI.connect(nearConfig);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DB 코드
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const connection = mysql.createPool({
  connectionLimit: 10,
  host: '127.0.0.1',
  user: 'root',
  password: 'FCLrZEkObfsc1AyZ',
  database: 'neardb',
});

const ssl_options = {
  ca: fs.readFileSync('/etc/letsencrypt/live/loveplant.shop/fullchain.pem'),
  key: fs.readFileSync('/etc/letsencrypt/live/loveplant.shop/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/loveplant.shop/cert.pem')
};


app.use(express.json());
app.use(express.urlencoded({
  extended: true
}))
app.use(express.static(path.join(__dirname, 'public')));
// app.get('/', (req, res) => res.send('linked!'));

app.get("/", (req, res) => {
  console.log('');
  console.log('경로 : get("/")');
  console.log('');
  res.sendStatus(200)
})
//필요 변수들 
let account_name = '계정명';
let receive_account = 'receive_account변수받아야함.'; //송금 받을 유저계정
let send_near; //보낼 Near 양
let balance = '{초기화balance}'; //거래 후 잔액
let sender = 'near.test(또는 변수)'; //보낸 계정
let blockHeight = '가져와야함';



let transferCheck = false; //'송금' 시 유저 입력 무조건 받기.
let sendNearInputCheck = false;

// kakao
app.post("/kakao", async function (req, res) {

  const userRequest = req.body.userRequest;
  const userId = userRequest.user.id;
  //utterance : 유저가 입력한 채팅
  let msg = userRequest.utterance;
  console.log('==================================================');
  console.log('경로 : post("/kakao")');
  console.log('req.body: ', req.body);
  console.log('userId: ', userId);
  console.log('msg: ', msg);
  console.log('==================================================');
  console.log('');

  //유저 입력
  switch (msgParse(msg)) {
    case '/시작':
      //1-1 계정 생성
      //1-2 이미 존재하는 계정 ->init
      const result = await queryAccountName(userId);
      console.log('result:', result);
      if (result == undefined) {
        console.log('존재하지 않음, 계정 생성 진행');
        createAccount(userId);
        res.send(welcomeData);
      } else {
        account_name = result;
        console.log('존재함, init gogo account_name:', account_name);
        res.send(already_account);
      }
      break;
    case 'init':
      transferCheck = false;
      sendNearInputCheck = false;
      res.send(already_account);
      break;
    case 'FAQ':
      console.log('case FAQ')
      res.send(FaqData);
      break;
    //============================================
    case 'Very Near란?':
      console.log('Very Near란?')
      res.send(VeryNear);
      break;
    //--------------------------------------------
    case 'what':
      console.log('what')
      const what = JSON.stringify({
        "version": "2.0",
        "template": {
          "outputs": [{
            "basicCard": {
              "title": "VeryNear는 무엇을 제공하나요?",
              //"description": "Very Near는 Near Protocol의 새로운 지갑 인터페이스로, 메신저 앱을 통해 Near Protocol에 쉽게 접근할 수 있도록 제공되는 서비스입니다. \n사용자들은 Very Near를 통해 간편하게 Near를 송금하고 거래내역을 조회할 수 있습니다.",
              "description": "VeryNear는 실제 돈을 사용하지 않고 웹3(블록체인)를 체험할 수 있는 플랫폼을 제공합니다. \n테스트넷 환경을 활용하여 사용자는 재정적인 부담 없이 Near Protocol을 탐색하고 상호작용할 수 있습니다.",
              "thumbnail": {
                "imageUrl": "https://loveplant.shop:441/image.png"
              },
              "buttons": [
                { "action": "message", "label": "뒤로가기", "messageText": "FAQ" }
              ]
            }
          }]
        }
      })
      res.send(what);
      break;
    case 'how friendly':
      const how = JSON.stringify({
        "version": "2.0",
        "template": {
          "outputs": [{
            "basicCard": {
              "title": "어떻게 사용자 친화적인 서비스를 구현하나요?",
              "description": "VeryNear는 메신저앱과 같은 사용자들에게 이미 익숙한 애플리케이션을 통해 사용자는 언제든지 Near Protocol에 접근할 수 있으며, 친숙하고 편리한 경험을 제공합니다. \n또한, VeryNear는 자금 이체, Near 기반 애플리케이션 접근, 거래 내역 조회와 같은 기능을 제공하여 사용자가 웹3에서 다양한 사용자 플로우를 경험하며 원활한 사용자 경험(UX)을 제공합니다.",
              "thumbnail": {
                "imageUrl": "https://loveplant.shop:441/image.png"
              },
              "buttons": [
                { "action": "message", "label": "뒤로가기", "messageText": "FAQ" }
              ]
            }
          }]
        }
      })
      res.send(how);
      break;
    case 'for':
      console.log('for');
      const why = JSON.stringify({
        "version": "2.0",
        "template": {
          "outputs": [{
            "basicCard": {
              "title": "VeryNear는 누구를 위해 디자인되었나요?",
              "description": "VeryNear는 이전에 웹3(블록체인)에 진입하기를 망설였던 사용자, 웹3 온보딩을 경험해보고 싶은 사용자, 그리고 해당 서비스에 호기심 또는 관심이 있는 모든 사용자를 대상으로 디자인되었습니다.",
              "thumbnail": {
                "imageUrl": "https://loveplant.shop:441/image.png"
              },
              "buttons": [
                { "action": "message", "label": "뒤로가기", "messageText": "FAQ" }
              ]
            }
          }]
        }
      })
      res.send(why);
      break;
    //============================================    
    case '계정에 관하여':
      res.send(aboutAccount);
      break;
    case 'FAQ_account':
      res.send(FAQ_account);
      break;
    case 'FAQ_createAccount':
      res.send(FAQ_createAccount);
      break;
    case 'FAQ_usingAccount':
      res.send(FAQ_usingAccount);
      break;
    //============================================
    case '사용 사례':
      res.send(aboutUsecase);
      break;
    case 'FAQ_transfer':
      res.send(FAQ_transfer);
      break;
    case 'FAQ_appAccess':
      res.send(FAQ_appAccess);
      break;
    case 'FAQ_selecteTx':
      res.send(FAQ_selecteTx);
      break;
    //============================================
    case '계정 생성':
      // /시작 메시지 입력 받고 계정 생성 클릭 시 확인 후 분기처리 (존재?get정보  ㄴ존재? 계정생성  )
      ///start 메세지 받으면 계정 생성 or 기본화면 띄우기 결정하기 위한 디비쿼리
      const exist = await checkUserExists(userId);
      console.log('계정 생성의 exist', exist);
      if (exist) {
        //존재하면, 해당 정보 가져오기(DB 쿼리)
        console.log('유저 고유ID와 매칭되는 DB의 값 존재')
      } else {
        //안하면, 계정 생성
        console.log('유저의 near 계정 없음 -> 계정 생성 코드')
        createAccount(userId);
      }

      res.send(createAccountData);
      break;
    case '송금': //사용자 입력 받아야 함.   .testnet을 입력해주세요.        
      transferCheck = true;
      res.send(transfer);
      break;
    case 'receiver 확인완료':
      sendNearInputCheck = true;
      res.send('{"version": "2.0", "template": {"outputs": [{"simpleText": {"text": "얼마나 보내시겠어요? 현재는 한 번에 1~200 Near까지만 보낼 수 있습니다."} },{"simpleText": {"text": "숫자만 입력하세요. (ex : 10NEAR -> 10)"} } ] } }');
      break;
    case 'send_near':
      const str_send_near = JSON.stringify({
        "version": "2.0",
        "template": {
          "outputs": [{
            "basicCard":
            {
              "title": `${send_near} NEAR가 맞으신가요?`,
              "description": "", "buttons": [
                { "action": "message", "label": "네", "messageText": "send_near 확인완료" },
                { "action": "message", "label": "아니오", "messageText": "send_near 재입력" }]
            }
          }]
        }
      })
      res.send(str_send_near);
      break
    case '범위 초과':
      res.send('{"version": "2.0", "template": {"outputs": [{"simpleText": {"text": "입력 범위가 아니거나, 문자 입력입니다."} },{"simpleText": {"text": "얼마나 보내시겠어요? 현재는 한 번에 1~200 Near까지만 보낼 수 있습니다."} },{"simpleText": {"text": "숫자만 입력하세요. (ex : 10NEAR -> 10)"} } ] } }');
      break;
    case 'send_near 문자입력':
      res.send('{"version": "2.0", "template": {"outputs": [{"simpleText": {"text": "입력 범위가 아니거나, 문자 입력입니다."} },{"simpleText": {"text": "얼마나 보내시겠어요? 현재는 한 번에 1~200 Near까지만 보낼 수 있습니다."} },{"simpleText": {"text": "숫자만 입력하세요. (ex : 10NEAR -> 10)"} } ] } }');
      break;
    case 'send_near 확인완료':
      //송금 로직 - 컨트랙트 코드 넣어야 함.
      console.log("송금 로직 - 컨트랙트 코드 넣어야 함.")
      res.send('미작성');
      break;
    case '계정 조회ㅁㅁㅁ':
      const selectAccount = JSON.stringify({
        "version": "2.0",
        "template": {
          "outputs": [{
            "itemCard": {
              "imageTitle": {
                "title": "계정 조회",
                "description": ""
              },
              "title": "", "description": "",
              "itemList": [{
                "title": "잔액", "description": "{잔액변수}"
              },
              { "title": "계정생성시점", "description": "{계정생성시점})" }, { "title": "계정생성번호", "description": "{JCpYi887z...})" }, { "title": "전체거래횟수", "description": "{12회})" }], "itemListAlignment": "right", "buttons": [{ "action": "message", "label": "송금", "messageText": "송금" }, { "action": "message", "label": "계정 조회", "messageText": "계정 조회" }, { "action": "message", "label": "거래내역 조회", "messageText": "거래내역 조회" }], "buttonLayout": "vertical"
            }
          }]
        }
      })
      res.send(selectAccount);
      break;
    case '거래내역 조회': //기획 변경
      res.send(selectTransactionData);
      break;
    case '블록 검색기':
      res.send(blockExplorerData);
      break;
    case '미니게임':
      const originalUrl = `https://loveplant.shop:7777?id=${account_name}`;
      // Url
      turl.shorten(originalUrl).then((res1) => {
        console.log('turl.shorten res1:', res1);
        const 어쩌구 = JSON.stringify({
          "version": "2.0",
          "template": {
            "outputs": [{
              "basicCard": {
                "title": `미니게임 해부러\n\n${res1}`,
                "description": "",
                "thumbnail": {
                  "imageUrl": "https://loveplant.shop:441/image.png"
                },
                "buttons": [
                  { "action": "message", "label": "처음으로", "messageText": "init" }

                ]
              }
            }]
          }
        });

        res.send(어쩌구);


      }).catch((err) => {
        console.log('turl.shorten err:', err);
      })

      //여기
      break;
    /**
     * // callContractCheckId();
  // callContractGetAccountInfo();
  // callContractTransferTx();
     */
    case 'test':
      //account_name = 'admiring-contract';
      //callContractCheckId(account_name);
      //callContractGetAccountInfo(account_name);
      const senderName = account_name + ".testnet";
      const receiverName = receiver_name + ".testnet";
      const transferAmount = "50";

      //console.log('senderName:', senderName);
      //console.log('receiverName:', receiverName);
      //console.log('transferAmount:', transferAmount);
      break;

    case '계정 조회': //테스트 코드       
      //account_name = 'admiring-contract';
      //callContractCheckId(account_name);
      //callContractGetAccountInfo(account_name);
      const receiver_name = 'admiring-bluepill';
      //(senderName, receiverName, transferAmount)


      //callContractTransferTx(senderName, receiverName, transferAmount);

      let accountInfoObj;
      const accountInfo = await callContractGetAccountInfo(account_name).then((value) => {
        accountInfoObj = value;
      })
        .catch((error) => {
          console.error(error);
        });
      console.log('accountInfoObj:', accountInfoObj);

      const convertedBalance = parseFloat(accountInfoObj.amount) / Math.pow(10, 24);
      console.log('convertedBalance:', convertedBalance);
      const convertedBalanceFloor = Math.floor(convertedBalance);
      console.log('convertedBalanceFloor:', convertedBalanceFloor);
      balance = convertedBalanceFloor;
      blockHeight = accountInfoObj.block_height;

      const testCode = JSON.stringify({
        "version": "2.0",
        "template": {
          "outputs": [{
            "carousel": {
              "type": "basicCard",
              "items": [
                {
                  "title": "계정 조회",
                  "description": `Account name : ${account_name}\nBalance : ${balance}\nBlock height : ${blockHeight}`,
                  "buttons": [
                    { "action": "message", "label": "송금", "messageText": "송금" },
                    { "action": "message", "label": "계정 조회", "messageText": "계정 조회" },
                    { "action": "message", "label": "FAQ", "messageText": "FAQ" }
                    //{ "action": "message", "label": "거래내역 조회", "messageText": "거래내역 조회" }
                  ]
                }
                ,
                {
                  "title": "",
                  "description": "",
                  "thumbnail": {
                    "imageUrl": "https://loveplant.shop:441/image.png"
                  },
                  "buttons": [
                    { "action": "message", "label": "블록 검색기", "messageText": "블록 검색기" },
                    { "action": "message", "label": "미니게임", "messageText": "미니게임" }
                  ]
                }
              ]
            }
          }
          ]
        }
      })
      res.send(testCode);
      break;
    default:
      if (transferCheck) {
        transferCheck = false;
        console.log('송금받을 계정입력.')
        const inputReceiver = JSON.stringify({
          "version": "2.0",
          "template": {
            "outputs": [{
              "basicCard": {
                "title": `보내는 계정이 ${msg} 가 맞으신가요?`,
                "description": "", "buttons": [
                  { "action": "message", "label": "네", "messageText": "receiver 확인완료" },
                  { "action": "message", "label": "아니오", "messageText": "receiver 재입력" }
                ]
              }
            }]
          }
        });
        res.send(inputReceiver);
        break;
      }
      if (sendNearInputCheck) {
        sendNearInputCheck = false;
        console.log('보낼 Near 입력');

        break;
      }
      res.send(defaultData);
      break;
  }
})
https.createServer(ssl_options, app).listen(441, () => console.log('Server Up and running at 441'));
//================================================================================================================
// 초기 데이터
const welcomeData = JSON.stringify({
  version: "2.0",
  template: {
    outputs: [{
      basicCard: {
        title: "안녕하세요? 당신에게 더 가까운 지갑, 베리니어입니다.",
        description: "",
        buttons: [
          { action: "message", label: "계정 생성", messageText: "계정 생성" },
          { action: "message", label: "FAQ", messageText: "FAQ" }
        ]
      }
    }]
  }
})





const already_account = JSON.stringify({
  "version": "2.0",
  "template": {
    "outputs": [{
      "carousel": {
        "type": "basicCard",
        "items": [{
          "title": "Welcome! \n당신에게 가까운 지갑,\n Very Near 입니다.",
          "description": "",
          "buttons": [
            { "action": "message", "label": "송금", "messageText": "송금" },
            { "action": "message", "label": "미니게임", "messageText": "미니게임" },
            { "action": "message", "label": "FAQ", "messageText": "FAQ" }
          ]
        },
        {
          "title": "",
          "description": "",
          "thumbnail": {
            "imageUrl": "https://loveplant.shop:441/image.png"
          },
          "buttons": [
            //{ "action": "message", "label": "거래내역 조회", "messageText": "거래내역 조회" },
            { "action": "message", "label": "계정 조회", "messageText": "계정 조회" },
            { "action": "message", "label": "블록 검색기", "messageText": "블록 검색기" }
          ]
        }
        ]
      }
    }
    ]
  }
})



//FAQ 클릭시 출력 데이터
const FaqData = JSON.stringify({
  "version": "2.0",
  "template": {
    "outputs": [{
      "basicCard": {
        "title": "자주 하는 질문",
        "description": "아래 항목을 클릭하세요.",
        "thumbnail": {
          "imageUrl": "https://loveplant.shop:441/image.png"
        },
        "buttons": [
          { "action": "message", "label": "무엇을 제공하나요?", "messageText": "what" },
          { "action": "message", "label": "누구를 위한 것인가요??", "messageText": "for" },
          { "action": "message", "label": "How friendly?", "messageText": "how friendly" }
        ]
      }
    }]
  }
})
//
const blockExplorerData = JSON.stringify({

  "version": "2.0",
  "template": {
    "outputs": [{
      "carousel": {
        "type": "basicCard",
        "items": [
          {
            "title": "블록 검색기에서 식별되는 abc님의 이름은 \'nice-glitch.test'이에요. ", "description": "아래 링크를 클릭하셔서 블록 검색기로 이동 후 'abc.glitch.test’를 입력해주세요.\n이해해주셔서 고마워요! \n https://testnet.mynearwallet.com/",
            "buttons": [
              { "action": "message", "label": "송금", "messageText": "송금" },
              { "action": "message", "label": "계정 조회", "messageText": "계정 조회" },
              //{ "action": "message", "label": "거래내역 조회", "messageText": "거래내역 조회" }
            ]
          }
          ,
          {
            "title": "",
            "description": "",
            "thumbnail": {
              "imageUrl": "https://loveplant.shop:441/image.png"
            },
            "buttons": [
              { "action": "message", "label": "블록 검색기", "messageText": "블록 검색기" },
              { "action": "message", "label": "미니게임", "messageText": "미니게임" },
              { "action": "message", "label": "FAQ", "messageText": "FAQ" }
            ]
          }
        ]
      }
    }
    ]
  }
});
// 거래내역 조회--------------------------------------------------------------------------------------------------------------
const selectTransactionData = JSON.stringify({
  "version": "2.0",
  "template": {
    "outputs": [{
      "simpleText": {
        "text": "1. aaa \n2. bbb \n3. ccc \n4. ddd \n5. eee \n6. fff \n7 ggg \n8 ggg \n9 ggg \n10 ggg \n11 ggg \n12 ggg \n13 ggg \n14. aaa \n15. bbb \n16. ccc \n17. ddd \n18. eee \n19. fff \n20 ggg \n1. aaa \n2. bbb \n3. ccc \n4. ddd \n5. eee \n6. fff \n7 ggg \n8 ggg \n9 ggg \n10 ggg \n11 ggg \n12 ggg \n13 ggg \n14. aaa \n15. bbb \n16. ccc \n17. ddd \n18. eee \n19. fff \n20. ads 1. aaa \n2. bbb \n3. ccc \n4. ddd \n5. eee \n6. fff \n7 ggg \n8 ggg \n9 ggg \n10 ggg \n11 ggg \n12 ggg \n13 ggg \n14. aaa \n15. bbb \n16. ccc \n17. ddd \n18. eee \n19. fff \n20. asd"
      }
    }, {
      "basicCard": {
        "title": "", "description": "",
        "buttons": [
          { "action": "message", "label": "송금", "messageText": "송금" },
          { "action": "message", "label": "계정 조회", "messageText": "계정 조회" },
          //{ "action": "message", "label": "거래내역 조회", "messageText": "거래내역 조회" }
        ]
      }
    }, {
      "basicCard": {
        "title": "",
        "description": "",
        "buttons": [
          { "action": "message", "label": "블록 검색기", "messageText": "블록 검색기" },
          { "action": "message", "label": "미니게임", "messageText": "미니게임" },
          { "action": "message", "label": "FAQ", "messageText": "FAQ" }
        ]
      }
    }]
  }
});
const defaultData = JSON.stringify({
  "version": "2.0",
  "template": {
    "outputs": [
      {
        "basicCard": {
          "title": "해당 입력을 읽지 못합니다.", "description": "",
          "buttons": [
            { "action": "message", "label": "처음으로", "messageText": "init" }
          ]
        }
      }
    ]
  }
});
const createAccountData = JSON.stringify({
  "version": "2.0",
  "template": {
    "outputs": [{
      "carousel": {
        "type": "basicCard",
        "items": [{
          "title": `계정 생성 완료 \n계정이 성공적으로 생성되었어요.`,
          "description": `잔액 : ${account_name}\n송금자 : ${receive_account}`,
          "buttons": [
            { "action": "message", "label": "송금", "messageText": "송금" },
            { "action": "message", "label": "미니게임", "messageText": "미니게임" },
            { "action": "message", "label": "FAQ", "messageText": "FAQ" }
          ]
        },
        {
          "title": "",
          "description": "",
          "thumbnail": {
            "imageUrl": "https://loveplant.shop:441/image.png"
          },
          "buttons": [
            //{ "action": "message", "label": "거래내역 조회", "messageText": "거래내역 조회" },
            { "action": "message", "label": "계정 조회", "messageText": "계정 조회" },
            { "action": "message", "label": "블록 검색기", "messageText": "블록 검색기" }
          ]
        }
        ]
      }
    }
    ]
  }
})
const transfer = JSON.stringify({
  "version": "2.0",
  "template": {
    "outputs": [{
      "basicCard": {
        "title": "송금받을 수신인의 계정을 입력하세요",
        //"description": "ex : glitch.testnet"
        "description": "",
        "buttons": [
          { "action": "message", "label": "처음으로", "messageText": "init" },
        ]
      }
    }]
  }
})
const VeryNear = JSON.stringify({
  "version": "2.0",
  "template": {
    "outputs": [{
      "basicCard": {
        "title": "Very Near란?",
        "description": "아래 항목을 클릭하세요\n홈은 'init'을 입략하세요",
        "thumbnail": {
          "imageUrl": "https://loveplant.shop:441/image.png"
        },
        "buttons": [
          { "action": "message", "label": "베리니어는 무엇인가요?", "messageText": "what" },
          { "action": "message", "label": "어떻게 사용하나요?", "messageText": "how" },
          { "action": "message", "label": "왜 베리니어인가요?", "messageText": "why" },
        ]
      }
    }]
  }
});

//FAQ - 계정
const aboutAccount = JSON.stringify({
  "version": "2.0",
  "template": {
    "outputs": [{
      "basicCard": {
        "title": "계정에 관하여",
        "description": "아래 항목을 클릭하세요\n홈은 'init'을 입략하세요",
        "thumbnail": {
          "imageUrl": "https://loveplant.shop:441/image.png"
        },
        "buttons": [
          { "action": "message", "label": "계정이란?", "messageText": "FAQ_account" },
          { "action": "message", "label": "계정생성은 어떻게 하나요?", "messageText": "FAQ_createAccount" },
          { "action": "message", "label": "계정은 어디에 쓰이나요?", "messageText": "FAQ_usingAccount" },
        ]
      }
    }]
  }
});
//FAQ - 계정_계정이란?
const FAQ_account = JSON.stringify({
  "version": "2.0",
  "template": {
    "outputs": [{
      "basicCard": {
        "title": "계정이란?",
        "description": "계정은 자산 저장 및 관리, 웹3 서비스와 상호 작용 가능한 ID.\n블록체인에서 계정은 알기 힘든 랜덤한 문자열이였지만, Near protocol은 human readable한 계정을 제공합니다.",
        "thumbnail": {
          "imageUrl": "https://loveplant.shop:441/image.png"
        },
        "buttons": [
          { "action": "message", "label": "뒤로가기", "messageText": "계정에 관하여" }
        ]
      }
    }]
  }
});
//FAQ - 계정_계정생성은 어떻게 하나요??
const FAQ_createAccount = JSON.stringify({
  "version": "2.0",
  "template": {
    "outputs": [{
      "basicCard": {
        "title": "계정생성은 어떻게 하나요?",
        "description": "Very Near에서 계정 생성은 버튼 클릭 한번으로 바로 생성 가능합니다.",
        "thumbnail": {
          "imageUrl": "https://loveplant.shop:441/image.png"
        },
        "buttons": [
          { "action": "message", "label": "뒤로가기", "messageText": "계정에 관하여" }
        ]
      }
    }]
  }
});
//FAQ - 계정_계정은 어디에 쓰이나요?
const FAQ_usingAccount = JSON.stringify({
  "version": "2.0",
  "template": {
    "outputs": [{
      "basicCard": {
        "title": "계정은 어디에 쓰이나요?",
        "description": "Near protocol 애플리케이션에 접근하기 위해 계정이 사용됩니다. \nVery Near를 사용해서 Near protocol을 즐기세요!",
        "thumbnail": {
          "imageUrl": "https://loveplant.shop:441/image.png"
        },
        "buttons": [
          { "action": "message", "label": "뒤로가기", "messageText": "계정에 관하여" }
        ]
      }
    }]
  }
});
//aboutUsecase=================================================
const aboutUsecase = JSON.stringify({
  "version": "2.0",
  "template": {
    "outputs": [{
      "basicCard": {
        "title": "very near 사용 사례",
        "description": "아래 항목을 클릭하세요\n홈은 'init'을 입략하세요",
        "thumbnail": {
          "imageUrl": "https://loveplant.shop:441/image.png"
        },
        "buttons": [
          { "action": "message", "label": "송금", "messageText": "FAQ_transfer" },
          { "action": "message", "label": "애플리케이션 액세스", "messageText": "FAQ_appAccess" },
          { "action": "message", "label": "거래 내역조회", "messageText": "FAQ_selecteTx" },
        ]
      }
    }]
  }
});
//송금
const FAQ_transfer = JSON.stringify({
  "version": "2.0",
  "template": {
    "outputs": [{
      "basicCard": {
        "title": "사용 사례 1. 송금",
        "description": "Very Near를 통해 복잡한 절차 없이 송금합니다.",
        "thumbnail": {
          "imageUrl": "https://loveplant.shop:441/image.png"
        },
        "buttons": [
          { "action": "message", "label": "뒤로가기", "messageText": "사용 사례" }
        ]
      }
    }]
  }
})
//애플리케이션 액세스
const FAQ_appAccess = JSON.stringify({
  "version": "2.0",
  "template": {
    "outputs": [{
      "basicCard": {
        "title": "사용 사례 2. 애플리케이션 액세스",
        "description": "Very Near의 계정을 사용해 Near protocol의 애플리케이션을 즐기세요!",
        "thumbnail": {
          "imageUrl": "https://loveplant.shop:441/image.png"
        },
        "buttons": [
          { "action": "message", "label": "뒤로가기", "messageText": "사용 사례" }
        ]
      }
    }]
  }
})
//거래 내역조회
const FAQ_selecteTx = JSON.stringify({
  "version": "2.0",
  "template": {
    "outputs": [{
      "basicCard": {
        "title": "사용 사례 3. 거래 내역조회",
        "description": "보기 힘든 블록 익스플로러는 No! 사용자에게 최적화된 거래내역 제공합니다.",
        "thumbnail": {
          "imageUrl": "https://loveplant.shop:441/image.png"
        },
        "buttons": [
          { "action": "message", "label": "뒤로가기", "messageText": "사용 사례" }
        ]
      }
    }]
  }
})
//애플리케이션 액세스
//거래 내역조회


//==================================================================================================
function msgParse(msg) {
  console.log('transferCheck:', transferCheck)
  console.log('sendNearInputCheck:', sendNearInputCheck)
  console.log("처음 들어온 msg:", msg);
  if (msg == 'init') {
    return msg;
  }
  if (msg == 'send_near 확인완료') {
    return msg;
  }
  // 수신인 입력 - 아니오 선택시 다시 송금클릭했을 때와 동일한 case 를 타기 위한 if문
  if (msg == 'receiver 재입력') {
    msg = '송금';
  }
  if (sendNearInputCheck) {
    console.log('보낼 니어 입력');
    console.log('isInRange(msg):', isInRange(msg));

    if (msg == 'send_near 재입력') {
      console.log("msg == 'send_near 재입력' // true")
      msg = 'receiver 확인완료';
    }
    if (isInRange(msg)) {
      console.log('msg=숫자, 니어 입력')
      send_near = Number(msg);
      msg = 'send_near';
    } else {
      //재입력 - 숫자 입력 해야 하는데 문자 입력함.
      console.log('재입력 - 숫자 입력 해야 하는데 문자 입력함.')
      msg = 'send_near 문자입력';
    }

    if (Number.isInteger(msg)) {
      if (Number(msg) > 0 && Number(msg) < 201) {
        send_near = Number(msg);
        msg = 'send_near';
        console.log(msg, ":", send_near);
      } else {
        // 재입력 메시지
        msg = '범위 초과';
        console.log('범위 초과-재입력 메시지');
      }
    }
  }

  console.log('msgParse:', msg);
  return msg;
}

// ㅎㅇ 준영



// 송금할 금액이 1~200 사이이고 정수인지 판단하는 메서드
function isInRange(number) {
  // Check if the number is an integer
  const number1 = Number(number);
  console.log(typeof number1);
  if (Number.isInteger(number1)) {
    console.log('integer yes');
    // Check if the number is within the range of 1 to 200
    if (number1 >= 1 && number1 <= 200) {
      console.log('between 1~200 no');
      return true; // Number is in the desired range
    } else {
      console.log('between 1~200 yes');
    }
  } else {
    console.log('integer no');
  }
  return false; // Number is outside the desired range or not an integer
}

//==================================================================
//===[DB]===========================================================
//==================================================================
//1. /start 메세지 받으면 계정 생성 or 기본화면 띄우기 결정하기 위한 디비쿼리
function checkUserExists(sns_id) {
  console.log('checkUserExists()');
  console.log('sns_id:', sns_id);

  let is_allocated_sns_id = 0;

  return new Promise((resolve, reject) => {
    //* 겹치는 sns_id를 확인하기 위한 쿼리 시작
    connection.query('SELECT * FROM `everything` WHERE sns_id = ?', [sns_id], (err, results) => {

      if (err) {
        reject(err);
        return;
      }

      is_allocated_sns_id = results.length;

      if (is_allocated_sns_id === 0) {
        console.log('is_allocated_sns_id === 0');

        resolve(false); // not exist

      } else if (is_allocated_sns_id === 1) {
        console.log('is_allocated_sns_id === 1');
        // 겹친다면, 유저에게 너 이미 지갑 있어요를 반환한다
        // console.log("UPDATE results : 유저에게 `너 이미 지갑 있어요`를 반환한다");
        resolve(true);
      }
    });
    ////////////////////////////// 겹치는 sns_id를 확인하기 위한 쿼리 끝
  });
}
//유저 고유 id 쿼리 후, 존재하지 않으면 DB에 쿼리날려서 유저 near 계정 매칭
async function createAccount(chatId) {
  console.log('create account');
  const createAccountsuccess = await createAccountQuery(chatId);

  // 성공 시
  if (createAccountsuccess) {
    console.log('if (createAccountsuccess) == true //생성성공')
    //const option = realMenuMsg.option;
    //const id = 'kakaoId.test';
    const balance = 200;
    const sender = 'near.test';
    // const text = `계정이 성공적으로 생성되었어요.\n\n잔액 : ${balance}\n송금자 : ${sender}`;
    const text = `Successfully created your account.\n\nBalance : ${balance}\nSender : ${sender}`;
    // 실패 시
  } else {
    createAccountFail(chatId);
  }
}

//2-2 아직 등록되지 않은 snsId -> 디비에 유저 계정 생성하는 쿼리
function createAccountQuery(sns_id) {
  console.log('createAccountQuery()');
  console.log('sns_id:', sns_id);

  let is_allocated_sns_id = 0;

  return new Promise((resolve, reject) => {

    // 겹치지 않는다면, is_allocated=0 이면서 id가 가장 낮은 행을 찾는다.
    connection.query('SELECT * FROM `everything` WHERE is_allocated = 0 ORDER BY id ASC LIMIT 1', (err, results) => {
      if (err) {
        reject(err);
        return;
      }

      console.log('createAccountQuery() select ok ');
      console.log('results:', results);

      // id가 가장 낮은 행에 sns_id를 update하고, is_allocated를 1으로 바꾼다
      connection.query('UPDATE `everything` SET sns_id = ?, is_allocated = ? WHERE id=?', [sns_id, 1, results[0]['id']], (err, results) => {
        if (err) {
          reject(err);
          return;
        }
        console.log('createAccountQuery() update ok');

        resolve(true);
      });
    });
  });
}// 해당 snsId 값을 가진 유저의 account_name 갸져오는 쿼리
function queryAccountName(snsId) {
  console.log('queryAccountName()');

  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM `everything` WHERE sns_id = ?', [snsId], (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('results.length:', results.length);
      console.log("results : ", results);
      console.log("results.length : ", results.length);


      // console.log("results[0]['account_name'] :", results[0]['account_name']);
      if (results.length == 0) {
        //존재 ㄴ
        resolve(undefined);
      } else {
        //존재 ㅇ
        resolve(results[0]['account_name']);
      }
      //
    });
  });
}

// 계정 조회 메서드
async function check_account(chatId) {
  console.log('check_account()');
  const success = true; /// ????????????????????
  if (success) {

    const userAccountName = await queryAccountName(chatId);
    console.log('userAccountName:', userAccountName);

    ///////////////////////////////////////////////////////////////
    ////        여기 실제 유저 account name 파라미터로 전달해야 됨. ?????????????????????????????????????????
    ///////////////////////////////////////////////////////////////
    const result = await callContractGetAccountInfo(userAccountName);
    console.log('result : ', result);


    const convertedBalance = parseFloat(result.amount) / Math.pow(10, 24);
    console.log('convertedBalance:', convertedBalance);
    const convertedBalanceFloor = Math.floor(convertedBalance);
    console.log('convertedBalanceFloor:', convertedBalanceFloor);


    const option = realMenuMsg.option;
    const text = `Account name : ${userAccountName}.testnet\nBalance : ${convertedBalanceFloor} NEAR\nBlock height : ${result.block_height}`;
    console.log('시발 text:\n', text);
    // const text = `Account name : ${parsedResult.account_id}\nBalance : ${parsedResult.balance} NEAR\nBlock height : ${parsedResult.height}`;
    // const text = `Account name : ${result.account_name}\nBalance : ${result.balance} NEAR\nAccount created at : ${result.created_at}\nAccount id : ${result.account_id}\nTransaction count : ${result.total_tx_count} times`; // 기획 수정

    telebot.sendMessage(chatId, text, option)
      .catch((error) => {
        console.log("defaultMessage sendMessage() catch() error.code:", error.code);
        console.log(error.response.body);
      });

    // 계정 조회 실패
  } else {
    const failOption = realMenuMsg.option;
    const failText = "Failed to retrieve account information.";
    telebot.sendMessage(chatId, failText, failOption);
  }

}





//################################################################
//###############        스마트 컨트랙트 코드      ####################
//################################################################

// 송금 시 수신자 계정명 유효한지 확인하는 메소드 (스컨)
async function callContractCheckId(accountName) {
  console.log('callContractCheckId()');
  console.log('accountName:', accountName);
  try {

    let response;
    try {
      response = await near.connection.provider.query({
        request_type: "view_account",
        finality: "final",
        account_id: accountName.concat(".testnet")
      });
    } catch (error) {
      console.log("Error querying account:", error);
      // Handle the error or throw it to handle it in the caller function
      // throw error;
    }

    console.log('response:');
    console.log(response);

    return response;

  } catch (error) {
    console.error("callContractCheckId() error:", error);
  }
}
async function callContractGetAccountInfo(accountName) {
  console.log('callContractGetAccountInfo()');
  console.log('callContractGetAccountInfo() accountName:', accountName);
  try {

    const 어카운트이름 = `${accountName}.testnet`;
    console.log('어카운트이름:', 어카운트이름);

    const response = await near.connection.provider.query({
      request_type: "view_account",
      finality: "final",
      account_id: 어카운트이름
    });
    console.log("callContractGetAccountInfo() response::::::", response);

    return response;


  } catch (error) {
    console.error("callContractGetAccountInfo() error:", error);
  }
}

async function callContractTransferTx(senderName, receiverName, transferAmount) {
  console.log('callContractTransferTx()');
  console.log('senderName:', senderName);
  console.log('receiverName:', receiverName);
  console.log('transferAmount:', transferAmount);
  console.log('typeof transferAmount:', typeof transferAmount);

  const accountId = senderName; // 송금자
  const account = await near.account(accountId);

  const contractId = "devjiwon.testnet";
  const contract = new nearAPI.Contract(account, contractId, {
    viewMethods: ["get_num", "get_account_info", "check_id"], // Specify the contract's view methods
    changeMethods: ["transfer"],
    sender: accountId,
  });

  try {
    //==========================================MetaTransaction (Transfer 메서드 호출하는 부분)==================================================
    // 위임할 Tx를 정의해주는 부분
    const signedResult = await account.signedDelegate({
      actions: [
        nearAPI.transactions.functionCall(
          // 송금하는 메서드
          "transfer",
          {
            amount: transferAmount, // 보내는 near
            to: receiverName, // 수신자
          },
          300000000000000, // 가스비
          0 // 보증금
        ),
      ],
      blockHeightTtl: 60, // Ttl(time to live) : 해당 위임하는 거래가 어느 블록까지 유효한지 블록 갯수를 지정해주는 것.
      // receiverId: "parkjiwon.testnet", // 메타 tx가 수행되었다는 걸 어떻게 보여줘야 할까
      receiverId: "devjiwon.testnet", // 메타 tx가 수행되었다는 걸 어떻게 보여줘야 할까
    });

    console.log("signedResult", signedResult);
    console.log('signedResult.delegateAction.senderId:', signedResult.delegateAction.senderId);
    console.log('signedResult.delegateAction.receiverId:', signedResult.delegateAction.receiverId);

    // Relayer Side
    const relayerKeyPair = nearAPI.KeyPair.fromString(
      // 컨트랙트 배포한 사람 계정 개인키
      "55qEt4vr5fGcX9ugX92suhjqq72eEKYFshxkEpc1uzoZ572M5EEimrFjfMcggeN1NctsP2HzHf57dtKMCechM7mY" // devjiwon
      // "G1map2Hp2cnNE9DDqE2fFn463vHNDhZGrf6GinvvJS62JZLoZDPySFXJahxgxwD3MAsWNF9PwxVVc4zqN9D9L8B" // ????
    );
    // keyStore 생성함.
    await keyStore.setKey(
      "testnet",
      "devjiwon.testnet",
      relayerKeyPair
    );
    // 대신 수수료 낼 사람
    const signingAccount = await near.account("devjiwon.testnet");

    // 대신 수수료 낼 사람이 서명하고 tx 전송한다.?
    const signAndSendTransactionResult = await signingAccount.signAndSendTransaction({
      actions: [actionCreators.signedDelegate(signedResult)],
      receiverId: signedResult.delegateAction.senderId,
    });

    // 송금하는 스컨 호출하고 결과 받는 부분
    console.log(
      "signedResult.delegateAction.receiverId:", signedResult.delegateAction.receiverId
    );
    //==========================================MetaTransaction (Transfer 메서드 호출하는 부분)==================================================

    console.log('signAndSendTransactionResult:', signAndSendTransactionResult);
    console.log('signAndSendTransactionResult.transaction_outcome.outcome.gas_burnt:', signAndSendTransactionResult.transaction_outcome.outcome.gas_burnt);
    console.log('signAndSendTransactionResult.transaction_outcome.block_hash:', signAndSendTransactionResult.transaction_outcome.block_hash);

    const returnData = {
      senderId: signedResult.delegateAction.senderId,
      receiverId: signedResult.delegateAction.receiverId,
      gas_burnt: signAndSendTransactionResult.transaction_outcome.outcome.gas_burnt,
      block_hash: signAndSendTransactionResult.transaction_outcome.block_hash,
      to: receiverName
    }

    return returnData;

  } catch (error) {
    console.error("callContractTransferTx() error:", error);
  }
}
//################################################################
//###############      스마트 컨트랙트 코드 끝     ####################
//################################################################
