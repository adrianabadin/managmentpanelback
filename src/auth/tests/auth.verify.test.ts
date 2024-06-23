//@ts-nocheck
import {expect,it,describe,vi,afterEach, beforeEach} from "vitest"
import { prismaClient } from "../auth.service"
import { AuthVerifyModule } from "../auth.service.verify"
import argon from 'argon2';
import { Prisma } from "@prisma/client";
vi.clearAllMocks()
const authVerify=new AuthVerifyModule()
const createReturn:Required<Prisma.UserCreateInput> ={hash:"tefsfw",username:"aabadin@gmail.com",lastname:"Abadin",name:"Adrian",id:"texto"}
    const findUniqueSpy=vi.spyOn(prismaClient.users,"findUnique")  
    const argonSpy=vi.spyOn(argon,"verify")
    const createSpy=vi.spyOn(prismaClient.users,"create")
    describe("AuthVerifyModule",()=>{
    describe(".SignUpUser",()=>{
    beforeEach(()=>{vi.resetAllMocks()})
    const doneSpy=vi.fn()
    it("should call findUnique and create if params are provided and return a UsersCreteInput Type",async()=>{
    findUniqueSpy.mockResolvedValue(null)
      createSpy.mockResolvedValue(createReturn)
       await authVerify.signUpVerify({body:{lastname:"adrian",name:"adrian",password:"qwedsaqw",username:"aabadin@gmail.com"}} as any,"adrian@ddd.com","qwedsazxc",doneSpy)
        
      expect(findUniqueSpy).toBeCalled()
      expect(findUniqueSpy).toReturnWith(null)
      expect(createSpy).toBeCalled()
      
      expect(doneSpy).toBeCalled()
      //expect(doneSpy).toBeCalledWith(null,createReturn)
    })
    it("Should not call create if findUnique returns a value and done is called with (error,false)",async ()=>{
        findUniqueSpy.mockImplementation(()=>Promise.resolve(createReturn)as any)
        const res=  await authVerify.signUpVerify({body:{lastname:"adrian",name:"adrian",password:"qwedsaqw",username:"aabadin@gmail.com"}} as any,"adrian@ddd.com","qwedsazxc",doneSpy)
        expect(findUniqueSpy).toBeCalled()
        expect(createSpy).not.toBeCalled()
        expect(doneSpy).toBeCalledWith(new Error("username already exists"),false)
    })
    it("Should break if body is undefined",async ()=>{
        findUniqueSpy.mockResolvedValue(null)
        const res=  await authVerify.signUpVerify(undefined as any,undefined,undefined as any,doneSpy)
        console.log(res)
        expect(findUniqueSpy).toBeCalled()
        expect(findUniqueSpy).toReturnWith(null) 
        expect(createSpy).not.toBeCalled()
        expect(doneSpy).toBeCalledWith(new TypeError("Cannot read properties of undefined (reading 'body')") ,false)

    
    })
    
    })
describe("loginVerify",()=>{
        afterEach(()=>{vi.resetAllMocks()})
    const doneSpy=vi.fn()
        it("Should call argon if findUnique returns a value and call done (null,User)",async()=>{
findUniqueSpy.mockResolvedValue(createReturn)
argonSpy.mockResolvedValue(true)
        await authVerify.loginVerify("Adrian","123456",doneSpy)
        expect(findUniqueSpy).toBeCalled()
        expect(argonSpy).toBeCalled
        expect(doneSpy).toBeCalledWith(null,createReturn)
    })
    it("Should call argon and call done(error,false) when argon returns false",async ()=>{
        findUniqueSpy.mockResolvedValue(createReturn)
        argonSpy.mockResolvedValue(false)
        await authVerify.loginVerify("Adrian","123456",doneSpy)
        expect(findUniqueSpy).toBeCalled()
        expect(argonSpy).toBeCalled()
        expect(doneSpy).toBeCalledWith(new Error("Password is incorrect"),false)

    })
    it("Should call argon and call done(error,false) when findUnique returns undefined",async ()=>{
        findUniqueSpy.mockResolvedValue(null)
        argonSpy.mockResolvedValue(false)
        await authVerify.loginVerify("Adrian","123456",doneSpy)
        expect(findUniqueSpy).toBeCalled()
        expect(argonSpy).not.toBeCalled()
        expect(doneSpy).toBeCalledWith(new Error("User doesnt exists"),false)

    })
})
})