export abstract class GCError extends Error{
    public text:string
    constructor(errorContent?:any,message:string="Generic GC Error",code:string="GC1000"){
        super(message)
        this.text=message
        this.name="Generic GC Error"
        
    }
}

export class idIsMissing extends GCError{
    constructor(errorContent?:any,message:string="Debes proveer un id valido",code:string="GC1001"){
        super(errorContent,message,code)
    }
}
