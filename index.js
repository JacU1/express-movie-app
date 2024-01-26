require('dotenv').config();
const express = require('express');
const cors = require('cors');
const needle = require('needle');
const apiCache = require('apicache');
const rateLimit = require('express-rate-limit');
const http = require("http");
const morgan = require("morgan");
const PORT = process.env.PORT || 8080;

const app = express();

// Middleware
app.use(morgan("dev"));

//JSON parser
app.use(express.json());

//Rate limiter
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20
});

app.use(limiter);
app.set('trust proxy', 1);

//CORS
app.use(cors());
app.options('*');

//Env variables
const API_BASE_URL = process.env.BASE_URL;
const API_KEY = process.env.API_KEY;
const SUBJECT = process.env.MAIL_SUBJECT;
const TO_EMAIL = process.env.TO_EMAIL;
const TO_NAME = process.env.TO_NAME;

//Init cache
let cache = apiCache.middleware;

app.post('/api/send-mail', cache('2 minutes') , async (req,res) => {
  const reqBody = req.body.sender;
  try {
      await needle('post', `${API_BASE_URL}`, JSON.stringify({
          sender: { 
                    name: reqBody.name, 
                    email: reqBody.email
                  },
          to: [{ email: TO_EMAIL , name: TO_NAME }],
          subject: SUBJECT,
          htmlContent: `<html>
                          <head></head>
                          <body>
                              <h2>Dzień dobry,</h2>
                              <br />
                              <p>Nazywam się ${ reqBody.name }</p>
                              <br />
                              <p>Przesyłam moje dane i informuję że jestem zainteresowany/ana pracą</p>
                              <br />
                              <p>${ reqBody.email }</p>
                              <br />
                              <p>${ reqBody.phone }</p>
                              <br />
                              <p>Dodatkowe informacje</p>
                              <br />
                              <p>${ reqBody.additionalInfo }</p>
                          </body>
                      </html>`
      }), { headers : { 'api-key' : API_KEY, 'accept': 'application/json' } });
      res.status(200).json({'status':'200', 'message': 'Mail send successfully', 'type': 'succeed'});   
  } catch (error) {
      res.status(500).json({error});
  }
});

// serve the API on 80 (HTTP) port
const httpServer = http.createServer(app);

httpServer.listen(PORT, () => {
    console.log('HTTP Server running on port' + ' ' +PORT);
});
