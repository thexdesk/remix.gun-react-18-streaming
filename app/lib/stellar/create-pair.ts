import StellarSdk from "stellar-sdk";

const pair = StellarSdk.Keypair.random();

const createTestAccount = (): { secret: string; publicKey: string } => {

  // We create our pair of keys
  const secret = pair.secret();
  const publicKey = pair.publicKey();

  return {
    secret,
    publicKey
  };
};

const activeTestAccount = async (publicKey: string) => {

  // We request the activation of our Stellar Friendbot account
  const response = await fetch(
    `https://friendbot.stellar.org?addr=${publicKey}`
  );


  // We show the result of the answer
  const responseJSON = await response.json();

  return responseJSON;
};

export { createTestAccount, activeTestAccount };
