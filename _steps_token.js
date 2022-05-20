/**
 * --------Issue Token---------
 * 1. install jsonwebtoken
 * 2. require jwt by (var jwt = require('jsonwebtoken');)
 * 3. create a secret from node typing (require('crypto').randomBytes(64).toString('hex'))
 * 4. paste it on .env with name ACCESS_TOKEN_SECRET=
 * 5. create a token when user create or login like (const token= jwt.sign({email:email}, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' }))
 * 6. send res with result like accessToken: token
 * 7. recive token in clint like (const accessToken= data.token;) and set in State setToken(accessToken)
 * 8. before set to state set it on localstorage (localStorage.setItem('accessToken', accessToken))
 * 
 * ---------Send Token To BackEnd-----------
 * 1. When sign out remove token like (localStorage.removeItem('accessToken'))
 * 2. When Get Item set a headers with get method ('authoriztion': `bearer ${localStorage.getItem('accessToken')}`)
 * 3. create a middle wire function verifyJWT With three parameter (req, res,next)
 * 4. recive from backend as headers (const authHeader= req.headers.authorization;)
 * 5. if(!authHeader){
 * return res.status(401).send({message:'UnAuthorized Access'})
 * }
 * 6. split the authHeader (const token= authHeader.split(' ')[1];)
 * 7. copy verify frow jwt git
jwt.verify(token, cert, function(err, decoded) {
  console.log(decoded.foo)
});
 * 8.if(err){
      return res.status(403).send({message: 'Forbidden Access'})
    }
    req.decoded= decoded;
    next();
* 9. compare decodedemail and email then load data and else send status 403 
*/