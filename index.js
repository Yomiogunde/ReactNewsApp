const express = require('express');   //local constant is the result of the required call
const request = require('request');   // a function to conduct the api request on the hackernews api top stories nmethod
const path = require('path');
const stories = require('./stories');

const app = express();   // constant of app is the result of calling the express function

app.use((req, res, next) => { // app.use ..callback with 3 parameters. Next is called when app is done running
    console.log('Request details. Method:', req.method, 'Original url:', req.originalUrl);
    
  next();
});

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
  
    next();
  });

app.use(express.static(path.join(__dirname, 'client/dist')));

//.get method creates a http get request for the api - 2 parameters - 1st param is a string which represents the path fro the request
// 2nd param is a callback funtion which fires when the path is hit in a GET request - request (req) and response (res)  
app.get('/ping', (req, res) => {     // req contains details of request and res contains method of response
    res.send('pong!');  
  }); 

  app.get('/stories', (req, res) => {
    res.json(stories);   // to respond wiith json data. allows us to pass stories into the method and respond with json format from api
  });

  app.get('/stories/:title', (req, res) => {   //route parameter
    const { title } = req.params;

    res.json(stories.filter(story => story.title.includes(title)));
  });

  app.get('/topstories', (req, res, next) => {
    request(
      { url: 'https://hacker-news.firebaseio.com/v0/topstories.json' },
      (error, response, body) => {
        if (error || response.statusCode !== 200) {
          return next(new Error('Error requesting top stories'));
        }
        
        const topStories = JSON.parse(body);
      const limit = 10;

      Promise.all(
        topStories.slice(0, limit).map(story => {
          return new Promise((resolve, reject) => {
            request(
            { url: `https://hacker-news.firebaseio.com/v0/item/${story}.json` },
            (error, response, body) => {

                if (error || response.statusCode !== 200) {
                 return next(new Error('Error requesting story item'));
                }
              resolve(JSON.parse(body));

              }
            );
        })
      
    })
      )
      .then(fullTopStories => {
        res.json(fullTopStories);
      })

      .catch(error => next(error));
    }
  )
});

app.use((err, req, res, next) => {
  res.status(500).json({ type: 'error', message: err.message });
});

// start the app with app.listen function - 2 parameters - PORT
const PORT = 3000;
app.listen(PORT, () => console.log(`listening on ${PORT}`));

// same as below
// app.listen(3000, () => {       // 2 parameters - port and call back function that will fire once the application has started
// console.log('listening on 3000');
//});
