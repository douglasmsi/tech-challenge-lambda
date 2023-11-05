const AWS = require("aws-sdk");
const cognitoIdentityProvider = new AWS.CognitoIdentityServiceProvider();

async function onRegister(event) {
  const { name, email, password, cpf, phone_number, address } = event; // Adicione o atributo cpf

  const authenticationParams = {
     ClientId: process.env.CLIENTID,
    Username: email,
    Password: password,
    UserAttributes: [
      {
        Name: "email",
        Value: email,
      },
      {
        Name: "name",
        Value: name,
      },
      {
        Name: "phone_number",
        Value: phone_number,
      },
      {
        Name: "address",
        Value: address,
      },
      {
        Name: "custom:cpf", // Adicione o atributo CPF aqui
        Value: cpf,
      },
    ],
  };
  const authResponse = await cognitoIdentityProvider
    .signUp(authenticationParams)
    .promise();
    
  return {
    message: "User registered successfully.",
    body: {
      statusCode: 200,
      cpf,
      userId: authResponse?.UserSub,
    },
  };
}

async function onLogin(event) {
  const { cpf, password } = event; // Modifique para pegar CPF e senha

  const loginParams = {
    AuthFlow: "CUSTOM_AUTH", // Use o fluxo de autenticação personalizado
    ClientId: process?.env?.CLIENTID,
    AuthParameters: {
      USERNAME: cpf, // Modifique para usar o CPF como USERNAME
      PASSWORD: password,
    },
  };

  try {
    const loginResult = await cognitoIdentityProvider
      .initiateAuth(loginParams)
      .promise();

    return {
      statusCode: 200,
      message: "User authenticated successfully.",
      body: {
        token: loginResult?.AuthenticationResult?.AccessToken,
        cpf: cpf, // Inclua o CPF na resposta
        refreshToken: loginResult?.AuthenticationResult?.RefreshToken,
      },
    };
  } catch (error) {
    console.log(error);
  }
}


exports.handler = async (event) => {
  if (event.auth === "register") {
    const response = await onRegister(event).then((result) => result);
    return response;
  } else if (event.auth === "login") {
    const response = await onLogin(event).then((result) => result);
    return response;
  }
};
