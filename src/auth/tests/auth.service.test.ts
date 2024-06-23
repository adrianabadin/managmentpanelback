//@ts-nocheck
import {expect,it,test,describe,vi,afterEach} from "vitest"
import { AuthService } from "../auth.service"
import { prismaClient } from "../auth.service"
import { Prisma } from "@prisma/client"
const authService=new AuthService()
const createReturn:Required<Prisma.UserCreateInput> ={hash:"tefsfw",username:"aabadin@gmail.com",lastname:"Abadin",name:"Adrian",id:"texto"}

describe("AuthService.SignUpUser", ()=>{
    const createSpy=vi.spyOn(prismaClient.users,"create").mockImplementation(()=>Promise.resolve(createReturn as any))
    afterEach(()=>{vi.restoreAllMocks()})
    
    
    it("Should call Prisma.user.create and should return an object containing the createReturn variable",async ()=>{
        const response= await authService.SignUpUser({username:"aabadin@gmail.com",lastname:"Abadin",name:"Adrian",password:"tttttttt"})    
        console.log(response,"texto",typeof response)
        expect(createSpy).toBeCalled()
        expect(response).toEqual({...createReturn})
    })
    // @ts-ignore
    it("Should throw if a param is not provided",async ()=>{expect(await authService.SignUpUser()).toBeUndefined()
    })
    // @ts-ignore
    it("Should throw if username is not provided",async ()=>{expect(await authService.SignUpUser({lastname:"ada",name:"fwefw",password:"vvrev"})).toBeUndefined()})
    // @ts-ignore
    it("Should throw if lastname is not provided",async ()=>{expect(await authService.SignUpUser({username:"texto",name:"fwefw",password:"vvrev"})).toBeUndefined()})
    // @ts-ignore
    it("Should throw if name is not provided",async ()=>{expect(await authService.SignUpUser({username:"texto",lastname:"fwefw",password:"vvrev"})).toBeUndefined()})
    //it('Should return a object containing {id:"texto"}',async ()=>{expect(await authService.SignUpUser({username:"aabadin@gmail.com",lastname:"fwssssefw",password:"ssssssss",name:"Adrian"})).toContain({id:"texto"})})
})

