
export abstract class AuthError extends Error {
    public text:string
    
        constructor(public errorContent?:any,message:string="Auth Error",public code:string="AUTH0"){
        super(message)
        this.name="Auth Error"
        this.text=message
        
    }
    }
    
    export class UserExists extends AuthError{
        constructor(errorContent?:any,message:string="El usuario ya existe!",code:string="AUTH01"){
            super(errorContent,message,code)
        }
    }
    export class UserDoesntExists extends AuthError{
        constructor(errorContent?:any,message:string="El usuario no existe!",code:string="AUTH02"){
            super(errorContent,message,code)
        }
    }
    
    export class LoginCredentials extends AuthError{
        constructor(errorContent?:any,message:string="Falta usuario o contraseña",code:string="AUTH03"){
            super(errorContent,message,code)
        }
    
    }
    
    export class WrongPassword extends AuthError{
        constructor(errorContent?:any,message:string="Contraseña Incorrecta",code:string="AUTH04"){
            super(errorContent,message,code)
        }
    
    }

    export class IssuanceMissingId extends AuthError{
        constructor(errorContent?:any,message:string="Debes proveer un id para generar el token",code:string="AUTH05"){
            super(errorContent,message,code)
        }
    
    }
    export class JWTMissing extends AuthError{
        constructor(errorContent?:any,message:string="El payload del token esta vacio",code:string="AUTH06"){
            super(errorContent,message,code)
        }
    
    }
    export class UnAuthorized extends AuthError{
        constructor(errorContent?:any,message:string="El usuario no esta logueado",code:string="AUTH07"){
            super(errorContent,message,code)
        }
    }

    