module.exports = function(){
  return new Promise((resolve, reject)=>{

    const OauthTwitter = require('electron-oauth-twitter');

    const twitter = new OauthTwitter({
      key: process.env.TWITTER_KEY,
      secret: process.env.TWITTER_SECRET,
    });

    twitter.startRequest().then(function(result) {
      resolve({
        token  : result.oauth_access_token,
        secret : result.oauth_access_token_secret
      });
    }).catch(function(error) {
      console.error(error, error.stack);
      reject(err);
    });
  });
}
