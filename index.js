const express = require('express');
const bodyParser = require('body-parser');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const AmazonCognitoIdentityServiceProvider = AmazonCognitoIdentity.CognitoUserPool;
const AmazonCognitoIdentityCredentials = AmazonCognitoIdentity.CognitoIdentityCredentials;

const app = express();
app.use(bodyParser.json());

app.get('/',(req,res)=>{
    res.send("hola mundo")
});

// Configure Amazon Cognito
const poolData = {
  UserPoolId: 'sa-east-1_qHj296Ic6',
  ClientId: '3juj99csikf5am11ru405lvepd',
};

const userPool = new AmazonCognitoIdentityServiceProvider(poolData);

// Register
app.post('/register', (req, res) => {
  const { username, password, email } = req.body;

  const attributeList = [
    new AmazonCognitoIdentity.CognitoUserAttribute({
      Name: 'email',
      Value: email,
    }),
    // + atributos???
  ];

  userPool.signUp(username, password, attributeList, null, (err, result) => {
    if (err) {
      console.error('Registration error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'User registered successfully', result });
  });
});

// Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
    Username: username,
    Password: password,
  });

  const userData = {
    Username: username,
    Pool: userPool,
  };

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: (session) => {
      // Access token, ID token, and refresh token are available in the session
      console.log('Authentication successful');
      res.json({ message: 'Login successful', session });
    },
    onFailure: (err) => {
      console.error('Login error:', err);
      res.status(401).json({ error: err.message });
    },
  });
});

app.get("/page/:username",(req, res) =>{
    //Trae de la db la información
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
