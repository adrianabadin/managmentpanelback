import {ExtractJwt,Strategy} from 'passport-jwt'
import passport from 'passport'
import { authServiceVerify } from './auth.service.verify'
import { Request } from 'express';
const cookieExtractor = function(req:Request) {
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
