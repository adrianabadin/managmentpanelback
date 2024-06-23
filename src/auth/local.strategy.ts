import passport from "passport";
import { Strategy } from "passport-local";
import { AuthVerifyModule } from "./auth.service.verify";
const authVerify=new AuthVerifyModule()
export const signUpStrategy =new Strategy({passReqToCallback:true},authVerify.signUpVerify)
export const loginStrategy=new Strategy(authVerify.loginVerify)
passport.use('register',signUpStrategy)
passport.use("login", loginStrategy)