//@ts-nocheck
import { describe,it,expect,vi,afterEach } from "vitest";
import { AuthController } from "../auth.controller";
import passport from "passport";
import { Prisma } from "@prisma/client";
import { prismaClient } from "../auth.service";
const authController=new AuthController();
const doneSpy=vi.fn()
const findUniqueSpy= vi.spyOn(prismaClient.users,"findUnique")
const createReturn:Required<Prisma.UserCreateInput> ={hash:"tefsfw",username:"aabadin@gmail.com",lastname:"Abadin",name:"Adrian",id:"texto"}

describe("AuthController",()=>{
    describe("serializeUser", ()=>{
    it("should call done callback",async ()=>{
        await authController.serialize(createReturn,doneSpy)
        expect(doneSpy).toBeCalledWith(null,"texto")
    
    })
    })
    describe("deSerializeUser", ()=>{
        findUniqueSpy.mockResolvedValue(createReturn)
        it("should call done callback with createRetun",async ()=>{
            await authController.deSerialize("texto",doneSpy)
            expect(doneSpy).toBeCalledWith(null,createReturn)
        })
    })

})