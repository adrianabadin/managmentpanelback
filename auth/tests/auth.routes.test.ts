//@ts-nocheck
import {vi,describe,it,expect} from "vitest"
import request from "supertest"
import app from "../../app.middleware"
import { prismaClient } from "../auth.service"
import { Prisma } from "@prisma/client"
import { server } from "../../app"
import express from 'express';
import argon from "argon2"
//app.listen(8080,()=>console.log("listening on port 8080"))
const createSpy= vi.spyOn(prismaClient.users,"create")
const findUniqueSpy=vi.spyOn(prismaClient.users,"findUnique")
const createReturn:Required<Prisma.UsersCreateInput> ={hash:"tefsfw",username:"aabadin@gmail.com",lastname:"Abadin",name:"Adrian",id:"texto"}
const argonSpy = vi.spyOn(argon,"verify")
export const logSpy=vi.fn()
describe("AuthRouter",()=>{
    it("Should login when passed a username and password that validates",async ()=>{
    findUniqueSpy.mockResolvedValue(createReturn)
    argonSpy.mockResolvedValue(true)
    createSpy.mockResolvedValue(createReturn)
        const response =await request(app).post("/auth/login")
        .send({username:"adrian@abadin.com",password:"11ssss1111"})
        .expect(200)
        expect(response.status).toBe(200)
        expect(findUniqueSpy).toHaveBeenCalled()
        expect(findUniqueSpy).toReturnWith(createReturn)
    })
it("Should Create a user if passed a body that validates schema",async ()=>{
    findUniqueSpy.mockResolvedValue(null)
    createSpy.mockResolvedValue(createReturn)
    const response= await request(app).post("/auth/signup").send({lastname:"adrian",name:"adrian",password:"qwedsaqw",username:"aabadin@gmail.com"}).expect(200)
    expect(findUniqueSpy).toBeCalled()
    expect(findUniqueSpy).toReturnWith(null)
    expect(createSpy).toBeCalled()
    expect(createSpy).toReturnWith(createReturn)
    expect(response.status).toBe(200)
})
})