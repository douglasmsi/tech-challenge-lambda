const AWS = require("aws-sdk");
const cognitoIdentityProvider = new AWS.CognitoIdentityServiceProvider();

async function onError(error) {
  var myErrorObj = {
    errorType: "InternalServerError",
    httpStatus: 500,
    body: error.message,
  };
  callback(JSON.stringify(myErrorObj));
}

async function onRegister(event, callback) {
  const { name, email, password } = event;

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
    ],
  };

  try {
    const authResponse = await cognitoIdentityProvider
      .signUp(authenticationParams)
      .promise();

    return {
      message: "User registered successfully.",
      body: {
        statusCode: 200,
        email,
        userId: authResponse?.UserSub,
      },
    };
  } catch (error) {
    return onError(error);
  }
}

async function onLogin(event) {
  const { email, password } = event;

  const loginParams = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: process?.env?.CLIENTID,
    AuthParameters: {
      USERNAME: email,
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
        email: email,
        refreshToken: loginResult?.AuthenticationResult?.RefreshToken,
      },
    };
  } catch (error) {
    onError(error);
  }
}

exports.handler = async (event, _, callback) => {
  if (event.auth === "register") {
    const response = await onRegister(event, callback).then((result) => result);
    return response;
  } else if (event.auth === "login") {
    const response = await onLogin(event).then((result) => result);
    return response;
  }
};
