export class InvalidParameterException extends Error{
    public text:string
    constructor(message:string = "The parameter provided is not adecuated to this method",public code:number =5000,public errorContent?:any){
        super(message)
        this.text=message
        

    }
}