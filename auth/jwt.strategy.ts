import {ExtractJwt,Strategy} from 'passport-jwt'
import passport from 'passport'
import { authServiceVerify } from './auth.service.verify'
const cookieExtractor = function(req:any) {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies['jwt'];
    }
    return token;
};
passport.use('jwt',new Strategy(
    {   passReqToCallback:false,
        jwtFromRequest:  ExtractJwt.fromExtractors([cookieExtractor]),
        secretOrKey: "Gran tipo MILEI",
},authServiceVerify.jwtVerify))
