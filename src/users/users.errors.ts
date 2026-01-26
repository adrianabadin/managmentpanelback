export abstract class UsersError extends Error {
  public text:string  
  constructor (public ErrorContent?: any, public message: string = 'Generic Users Error', public code: number = 3000) {
      super(message)
      this.name = 'Users Error'
      this.message = message
      this.text=message
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, UsersError)
      }
    }
  }

  export class ExpiredTokenError extends UsersError{
    
        public text: string
        constructor (public ErrorContent?: any, public message: string = 'El token ha Expirado', public code: number = 3001) {
          super(ErrorContent, message, code)
          this.text = message
          this.name = 'El token ha Expirado'
        }
    
     
  }
   export class UserNotFound extends UsersError{
    
        public text: string
        constructor (public ErrorContent?: any, public message: string = 'El usuario no existe', public code: number = 3001) {
          super(ErrorContent, message, code)
          this.text = message
          this.name = 'El usuario no existe'
        }
    
     
  }
   export class TokenMissmatch extends UsersError{
    
        public text: string
        constructor (public ErrorContent?: any, public message: string = 'El token no corresponde al usuario', public code: number = 3001) {
          super(ErrorContent, message, code)
          this.text = message
          this.name = 'El token no corresponde al usuario'
        }
    
     
  }