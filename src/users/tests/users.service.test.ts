//@ts-nocheck
import { expect, describe,it,afterEach,beforeEach,vi } from 'vitest';
import { prismaClient } from '../../auth/auth.service';
import { UsersService } from '../users.service';
import { Prisma } from '.prisma/client';
import {v4 as uuid} from "uuid"
const usersService= new UsersService()
const updateSpy= vi.spyOn(prismaClient.users,"update")
const userReturn:Required<Prisma.UsersCreateWithoutDepartmentsInput>={createdAt:new Date(), updatedAt:new Date(),hash:"texto",id:"bhbhbh",isAdmin:true,lastname:"adrian",name:"abadin",phone:"888888",username:"aabadin@gmail.com"}
describe("UsersService Tests",()=>{
    describe("setAdmin",()=>{
       // afterEach(()=>{vi.resetAllMocks()})
       beforeEach(()=>{
        vi.resetAllMocks()
        updateSpy.mockResolvedValue(userReturn as any)   
    }) 
               
        it("Should call update when id parameter is provided",async ()=>{
           const response= await usersService.setAdmin(uuid())
           expect(updateSpy).toBeCalled()
           expect(response).toBe(userReturn)
        })
        it("Should return undefined if ID is not provided and never call update",async ()=>{
            const response= await usersService.setAdmin()
            expect(updateSpy).not.toBeCalled()
            expect(response).toBe(undefined)
        })
    
    })
    describe("addDepartment",()=>{
     //   beforeEach(()=>{vi.resetAllMocks()})
     beforeEach(()=>{
        vi.resetAllMocks()
        updateSpy.mockResolvedValue(userReturn as any)   
    })   
     //updateSpy.mockResolvedValue(userReturn as any)
        it("Should call update if userID is provided and a departmentName is provided",async ()=>{
            const response = await usersService.addDepartment(uuid(),uuid())
            expect(updateSpy).toBeCalled()
            expect(updateSpy).toReturnWith(userReturn)
           expect(response).toBe(userReturn)
        })
        it("Should return undefined and never get to call update if either param is not provided",async ()=>{
            let response = await usersService.addDepartment(undefined,uuid())
            expect(updateSpy).not.toBeCalled()
            expect(response).toBe(undefined)
             response = await usersService.addDepartment(uuid())
             expect(updateSpy).not.toBeCalled()
             expect(response).toBe(undefined)

        })
    })
    describe("addDepartments",()=>{
        beforeEach(()=>{
            vi.resetAllMocks()
            updateSpy.mockResolvedValue(userReturn as any)   
        })
        it("it should call update if an uuid is provided  and a array of strings",async ()=>{
            const response = await usersService.addDepartments(uuid(),[uuid()])
            expect(updateSpy).toBeCalled()
            expect(response).toBe(userReturn)
        }) 
        it("Should not call updateSpy if a single string is provided",async()=>{
            const response = await usersService.addDepartments(uuid(),uuid())
            expect(updateSpy).not.toBeCalled()
            expect(response).toBe(undefined)
        }) 
        it("Should not call update if id UUID is not provided",async()=>{
            const response = await usersService.addDepartments(undefined,[uuid()])
            expect(updateSpy).not.toBeCalled()
            expect(response).toBe(undefined)

        })
        it("Should not call update and return undefined if an array of strings is not provided",async()=>{
            const response = await usersService.addDepartments(uuid())
            expect(updateSpy).not.toBeCalled()
            expect(response).toBe(undefined)

        })
    })
})
