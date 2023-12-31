import express from 'express';
import bodyParser from 'body-parser';
import AmazonCognitoIdentity from "amazon-cognito-identity-js";
const AmazonCognitoIdentityServiceProvider = AmazonCognitoIdentity.CognitoUserPool;
const AmazonCognitoIdentityCredentials = AmazonCognitoIdentity.CognitoIdentityCredentials;
import cors from "cors"
import 'dotenv/config'
import OpenAI from "openai";
import axios from 'axios';


//To deploy
const app= express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.get('/',(req,res)=>{
    res.send("testing")
});

// Configure Amazon Cognito
const poolData = {
  UserPoolId: process.env.USER_POOL_ID,
  ClientId: process.env.CLIENT_ID,
};

const userPool = new AmazonCognitoIdentityServiceProvider(poolData);

// Método de registro
app.post('/register', (req, res) => {
  const { username, password, email } = req.body;
  console.log(req.body);
  const attributeList = [
    new AmazonCognitoIdentity.CognitoUserAttribute({
      Name: 'email',
      Value: email,
    }),
    new AmazonCognitoIdentity.CognitoUserAttribute({
      Name: 'nickname',
      Value: username,
    }),
  ];

  userPool.signUp(username, password, attributeList, null, (err, result) => {
    if (err) {
      console.error('Registration error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'User registered successfully', result }).status(200);
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
      if (err.message == "User is not confirmed."){
        res.status(350).json({ error: err.message });
      }else{
        res.status(400).json({ error: err.message });
      }
      
    },
  });
});

//Metodo de traducción
app.post('/translate', async (req, res) => {
  try {
    const response = await axios.post(
      "https://api-free.deepl.com/v2/translate",
      new URLSearchParams({
        text: req.body.text,
        target_lang: req.body.target_lang,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': process.env.DEEPLTOKEN,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

const openai = new OpenAI(
  );
//Método de generación de imágenes
app.post('/genimg', async (req, res) => {
      const image = await openai.images.generate({ model: "dall-e-3", prompt: req.body.name });
    res.send(image.data[0]["url"])
});

//Método de mejoramiento de texto
app.post('/bettertext', async (req, res) => {
  var prompttext = "mejora el siguiente texto para impulsar su impacto"+req.body.name
  const completion = await openai.completions.create({
    model: 'gpt-3.5-turbo-instruct',
    prompt: prompttext,
    max_tokens: 150
    });
  res.send(completion.choices[0]["text"])
});

//Inicio del servidor
app.listen(process.env.PORT, () => {
  console.log('Server is running on port 3100');
});


