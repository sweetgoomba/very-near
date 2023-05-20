//==========================================near-api-js 세팅하는 부분==================================================
const nearAPI = require("near-api-js");
const { actionCreators } = require("@near-js/transactions");
const keyStore = new nearAPI.keyStores.InMemoryKeyStore();
async function callContractViewMethod() {
  const nearConfig = {
    networkId: "testnet",
    nodeUrl: "https://rpc.testnet.near.org",
    walletUrl: "https://wallet.testnet.near.org",
    helperUrl: "https://helper.testnet.near.org",
    explorerUrl: "https://explorer.testnet.near.org",
    keyStore: keyStore,
  };

  // 개인키로 활용해야 함.
  const keyPair = nearAPI.KeyPair.fromString(
    "55qEt4vr5fGcX9ugX92suhjqq72eEKYFshxkEpc1uzoZ572M5EEimrFjfMcggeN1NctsP2HzHf57dtKMCechM7mY"
  );
  await keyStore.setKey("testnet", "devjiwon.testnet", keyPair);

  const near = await nearAPI.connect(nearConfig);
  //console.log(near);
  const accountId = "devjiwon.testnet";
  const account = await near.account(accountId);
  const contractId = "devjiwon.testnet";
  const contract = new nearAPI.Contract(account, contractId, {
    viewMethods: ["get_num", "get_account_info", "check_id"], // Specify the contract's view methods
    changeMethods: ["transfer"],
    sender: accountId,
  });
  //==========================================near-api-js 세팅하는 부분==================================================

  try {
    const response = await near.connection.provider.query({
      request_type: "view_account",
      finality: "final",
      account_id: "parkjiwon.testnet",
    });
    console.log(response);

    const account = await near.account("example-account.testnet");
    await account.getAccountDetails();
    console.log(account);


    //==========================================MetaTransaction (Transfer 메서드 호출하는 부분)==================================================
    // 위임할 Tx를 정의해주는 부분
    const signedResult = await account.signedDelegate({
      actions: [
        nearAPI.transactions.functionCall(
          // 송금하는 메서드
          "transfer",
          {
            amount: "5", // 보내는 near
            to: "devjiwon.testnet", // 수신자
          },
          300000000000000, // 가스비
          0 // 보증금
        ),
      ],
      blockHeightTtl: 60, // Ttl(time to live) : 해당 위임하는 거래가 어느 블록까지 유효한지 블록 갯수를 지정해주는 것.
      receiverId: "devjiwon.testnet", // 메타 tx가 수행되었다는 걸 어떻게 보여줘야 할까
    });

    console.log(signedResult, "signedResult");

    // Relayer Side
    const relayerKeyPair = nearAPI.KeyPair.fromString(
      // 컨트랙트 배포한 사람 계정 개인키
      "G1map2Hp2cnNE9DDqE2fFn463vHNDhZGrf6GinvvJS62JZLoZDPySFXJahxgxwD3MAsWNF9PwxVVc4zqN9D9L8B"
    );
    // keyStore 생성함.
    await keyStore.setKey(
      "testnet",
      "relayertestrelayer.testnet",
      relayerKeyPair
    );
    // 대신 수수료 낼 사람
    const signingAccount = await near.account("relayertestrelayer.testnet");

    // 대신 수수료 낼 사람이 서명하고 tx 전송한다.?
    await signingAccount.signAndSendTransaction({
      actions: [actionCreators.signedDelegate(signedResult)],
      receiverId: signedResult.delegateAction.senderId,
    });

    // 송금하는 스컨 호출하고 결과 받는 부분
    console.log(
      "signedResult.delegateAction.receiverId:" +
        signedResult.delegateAction.receiverId
    );
    //==========================================MetaTransaction (Transfer 메서드 호출하는 부분)==================================================

    //==========================================MetaTransaction (CheckId 메서드 호출하는 부분)==================================================
    // check_id 호출
    const check_result = await contract.check_id({
      account_id: "devjiwon.testnet",
    });
    console.log(check_result); // 스컨에서 보낸 결과 받는 부분

    //==========================================MetaTransaction (CheckId 메서드 호출하는 부분)==================================================

    //==========================================MetaTransaction (get_account_info 메서드 호출하는 부분)==================================================
    // get_account_info 호출
    const account_info_result = await contract.get_account_info({
      account_id: "devjiwon.testnet",
    });
    console.log(account_info_result); // 스컨에서 보낸 결과 받는 부분
    //==========================================MetaTransaction (CheckId 메서드 호출하는 부분)==================================================
  } catch (error) {
    console.error("Error calling contract view method:", error);
  }
}

callContractViewMethod();
